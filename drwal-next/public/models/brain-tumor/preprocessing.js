/*
 * preprocessing.js — odpowiednik segment_brain_mask / preprocess_image / make_gradcam z Pythona.
 * Wymaga globalnych: cv (OpenCV.js), tf (TensorFlow.js).
 * Model dostaje RGB float32 0..255 (bez normalizacji), jak w Pythonie.
 */
(function (g) {
  "use strict";
  const SIZE = 260;
  const del = (...a) => a.forEach(x => { try { x && x.delete && x.delete(); } catch (e) {} });

  // JET (OpenCV): r,g,b = clamp(1.5 - |4x - k|)
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const JET = Array.from({ length: 256 }, (_, i) => {
    const x = i / 255;
    return [3, 2, 1].map(k => Math.round(255 * clamp01(1.5 - Math.abs(4 * x - k))));
  });

  const ratio = m => { const d = m.data; let c = 0; for (let i = 0; i < d.length; i++) if (d[i]) c++; return c / d.length; };

  // np.percentile(img, q) (interpolacja liniowa)
  function percentile(mat, q) {
    const h = new Array(256).fill(0), d = mat.data, n = d.length;
    for (let i = 0; i < n; i++) h[d[i]]++;
    const kth = k => { let c = 0; for (let v = 0; v < 256; v++) { c += h[v]; if (c > k) return v; } return 255; };
    const pos = q * (n - 1), lo = Math.floor(pos), hi = Math.ceil(pos);
    const a = kth(lo), b = kth(hi);
    return a + (b - a) * (pos - lo);
  }

  function segmentBrainMask(gray) {
    const w = gray.cols, h = gray.rows, A = w * h, T = [];
    const mk = () => { const m = new cv.Mat(); T.push(m); return m; };
    const zeros = () => cv.Mat.zeros(h, w, cv.CV_8UC1);
    let big = null;
    try {
      const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
      const img = mk(); clahe.apply(gray, img); clahe.delete();
      const bl = mk(); cv.GaussianBlur(img, bl, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

      const t1 = mk(), t2 = mk(), m = mk();
      cv.threshold(bl, t1, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
      // OpenCV dla 8U robi floor(thresh)
      cv.threshold(bl, t2, Math.floor(percentile(bl, 0.60)), 255, cv.THRESH_BINARY);
      cv.bitwise_or(t1, t2, m);

      const k = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(9, 9)); T.push(k);
      const cl = mk(); cv.morphologyEx(m, cl, cv.MORPH_CLOSE, k);

      // connected components
      const lab = mk(), st = mk(), ce = mk();
      const num = cv.connectedComponentsWithStats(cl, lab, st, ce, 8, cv.CV_32S);
      if (num <= 1) return zeros();
      const cx0 = w >> 1, cy0 = h >> 1, S = st.data32S, C = ce.data64F;
      let best = -1, bs = Infinity;
      for (let i = 1; i < num; i++) {
        const o = i * 5;
        if (S[o + 4] < A * 0.01) continue;
        const x = S[o], y = S[o + 1], ww = S[o + 2], hh = S[o + 3];
        let sc = Math.hypot(C[i * 2] - cx0, C[i * 2 + 1] - cy0);
        if (x < 5 || y < 5 || x + ww > w - 5 || y + hh > h - 5) sc += 1000;
        if (sc < bs) { bs = sc; best = i; }
      }
      if (best < 0) return zeros();
      const comp = zeros(); T.push(comp);
      const ld = lab.data32S, cd = comp.data;
      for (let i = 0; i < ld.length; i++) if (ld[i] === best) cd[i] = 255;

      // convex hull (wszystkie kontury zewnętrzne)
      const cnts = new cv.MatVector(); T.push(cnts);
      const hier = mk(), ci = comp.clone(); T.push(ci);
      cv.findContours(ci, cnts, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      if (cnts.size() === 0) return zeros();
      let hm = zeros(); T.push(hm);
      let ba = -1;
      for (let i = 0; i < cnts.size(); i++) {
        const c = cnts.get(i), hull = new cv.Mat(), hv = new cv.MatVector();
        cv.convexHull(c, hull, false, true);
        hv.push_back(hull);
        cv.drawContours(hm, hv, -1, new cv.Scalar(255), -1);
        const a = cv.contourArea(c);
        if (a > ba) { del(big); big = c; ba = a; } else c.delete();
        del(hull, hv);
      }

      // fill holes
      const fl = hm.clone(), fm = cv.Mat.zeros(h + 2, w + 2, cv.CV_8UC1); T.push(fl, fm);
      cv.floodFill(fl, fm, new cv.Point(0, 0), new cv.Scalar(255), new cv.Rect(), new cv.Scalar(0), new cv.Scalar(0), 4);
      const inv = mk(); cv.bitwise_not(fl, inv);
      cv.bitwise_or(hm, inv, hm);

      // fallback do elipsy
      if (ratio(hm) > 0.78 && big && big.rows >= 5) {
        const em = zeros(); T.push(em);
        cv.ellipse1(em, cv.fitEllipse(big), new cv.Scalar(255), -1, cv.LINE_8);
        hm = em;
      }

      // distance transform shrink
      const dist = mk(); cv.distanceTransform(hm, dist, cv.DIST_L2, 5);
      let mx = 0; const dd = dist.data32F;
      for (let i = 0; i < dd.length; i++) if (dd[i] > mx) mx = dd[i];
      if (mx <= 0) return zeros();
      const th = mk(); cv.threshold(dist, th, 0.08 * mx, 255, cv.THRESH_BINARY);
      const u8 = mk(); th.convertTo(u8, cv.CV_8U);
      const sm = mk(); cv.GaussianBlur(u8, sm, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
      const fin = new cv.Mat(); cv.threshold(sm, fin, 127, 255, cv.THRESH_BINARY);
      if (ratio(fin) < 0.08) { fin.delete(); return zeros(); }
      return fin;
    } finally { T.forEach(x => del(x)); del(big); }
  }

  /** img: HTMLImageElement -> { rgb: Uint8Array(260*260*3) po masce } */
  function preprocessMRI(img) {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext("2d", { willReadFrequently: true }).drawImage(img, 0, 0);
    const src = cv.imread(c), rgb = new cv.Mat(), res = new cv.Mat(), gray = new cv.Mat(), out = new cv.Mat();
    let mask = null;
    try {
      cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
      cv.resize(rgb, res, new cv.Size(SIZE, SIZE), 0, 0, cv.INTER_LINEAR);
      cv.cvtColor(res, gray, cv.COLOR_RGB2GRAY);
      mask = segmentBrainMask(gray);
      cv.bitwise_and(res, res, out, mask);
      return { rgb: new Uint8Array(out.data) };
    } finally { del(src, rgb, res, gray, out, mask); }
  }

  const one = o => (Array.isArray(o) ? o[0] : o);

  /**
   * Grad-CAM jak make_gradcam. conv = wyjście ostatniego Conv2D (liczy je wołający i je zwalnia),
   * headModel: conv -> predykcje. Zwraca { d: Float32Array, mh, mw } — mapa 0..1.
   */
  async function gradCAM(headModel, conv, cls) {
    let grads = null;
    try {
      grads = tf.grad(x => one(headModel.predict(x)).flatten().slice([cls], [1]).sum())(conv);
      const cam = tf.tidy(() => {
        const wt = grads.mean([0, 1, 2]);
        const c = conv.squeeze([0]).mul(wt).sum(-1).relu();
        return c.div(c.max().add(1e-8));
      });
      const d = await cam.data(), [mh, mw] = cam.shape;
      cam.dispose();
      return { d, mh, mw };
    } finally { grads && grads.dispose(); }
  }

  /** resize INTER_LINEAR, uint8, JET, addWeighted(0.62, 0.38) -> RGBA Uint8ClampedArray */
  function gradCAMOverlay(rgb, cam) {
    const m = cv.matFromArray(cam.mh, cam.mw, cv.CV_32F, Array.from(cam.d)), r = new cv.Mat();
    try {
      cv.resize(m, r, new cv.Size(SIZE, SIZE), 0, 0, cv.INTER_LINEAR);
      const p = r.data32F, o = new Uint8ClampedArray(SIZE * SIZE * 4);
      for (let i = 0; i < SIZE * SIZE; i++) {
        const v = Math.max(0, Math.min(255, Math.trunc(255 * p[i])));
        const [R, G, B] = JET[v];
        o[i * 4] = Math.round(rgb[i * 3] * 0.62 + R * 0.38);
        o[i * 4 + 1] = Math.round(rgb[i * 3 + 1] * 0.62 + G * 0.38);
        o[i * 4 + 2] = Math.round(rgb[i * 3 + 2] * 0.62 + B * 0.38);
        o[i * 4 + 3] = 255;
      }
      return o;
    } finally { del(m, r); }
  }

  g.MRI_SIZE = SIZE;
  g.preprocessMRI = preprocessMRI;
  g.gradCAM = gradCAM;
  g.gradCAMOverlay = gradCAMOverlay;
})(window);
