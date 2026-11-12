/* eslint-disable @typescript-eslint/no-explicit-any */
// Ładowanie bibliotek i modeli (singletony – przetrwają przejścia między stronami).
// Sam preprocessing (/brain-tumor/preprocessing.js) jest KOPIĄ pliku z działającej aplikacji – nie modyfikować.

export const BASE = "/models/brain-tumor";
export const TF_SRC = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
export const CV_SRC = "https://docs.opencv.org/4.x/opencv.js";

export const SAMPLES = [
  { file: `${BASE}/samples/sample-1.jpg`, label: "Przykład 1" },
  { file: `${BASE}/samples/sample-2.jpg`, label: "Przykład 2" },
  { file: `${BASE}/samples/sample-3.jpg`, label: "Przykład 3" },
];

const g = () => window as any;
const scripts = new Map<string, Promise<void>>();

export function loadScript(src: string, failFlag?: string): Promise<void> {
  const cached = scripts.get(src);
  if (cached) return cached;
  const p = new Promise<void>((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = () => res();
    s.onerror = () => { if (failFlag) g()[failFlag] = true; scripts.delete(src); rej(new Error(`Nie udało się pobrać skryptu: ${src}`)); };
    document.head.appendChild(s);
  });
  scripts.set(src, p);
  return p;
}

/** Czeka aż cv.Mat istnieje (bez `await cv`, który potrafi się zawiesić) – logika z działającej wersji. */
export function loadCV(): Promise<void> {
  const w = g();
  return new Promise((res, rej) => {
    loadScript(CV_SRC, "cvFailed").catch((e) => rej(new Error("Nie udało się pobrać OpenCV.js (sprawdź połączenie). " + e.message)));
    const t0 = Date.now(); let hooked = false;
    (function poll() {
      if (w.cvFailed) return;
      if (typeof w.cv !== "undefined") {
        if (w.cv.Mat) return res();
        if (!hooked) {
          hooked = true;
          if (typeof w.cv.then === "function") w.cv.then((m: any) => { w.cv = m; });
          else w.cv.onRuntimeInitialized = () => res();
        }
      }
      if (Date.now() - t0 > 120000) return rej(new Error("OpenCV.js ładuje się zbyt długo."));
      setTimeout(poll, 100);
    })();
  });
}

export type Engine = { labels: string[]; feat: any; head: any; model: any };
let enginePromise: Promise<Engine> | null = null;
let cvPromise: Promise<void> | null = null;
let onProgress: ((f: number) => void) | null = null;
export const setProgressListener = (fn: ((f: number) => void) | null) => { onProgress = fn; };

export function getCV() { return (cvPromise ??= loadCV().catch((e) => { cvPromise = null; throw e; })); }

export function getEngine(): Promise<Engine> {
  return (enginePromise ??= (async () => {
    await loadScript(TF_SRC);
    await loadScript(`${BASE}/preprocessing.js`);
    const tf = g().tf;
    const lab = fetch(`${BASE}/labels.json`).then((r) => (r.ok ? r.json() : [])).catch(() => []);
    let feat: any = null, head: any = null, model: any = null;
    try {
      [feat, head] = await Promise.all([
        tf.loadGraphModel(`${BASE}/gradcam/features/model.json`, { onProgress: (f: number) => onProgress?.(f) }),
        tf.loadGraphModel(`${BASE}/gradcam/head/model.json`),
      ]);
    } catch (e) {
      console.warn("[MRI] Brak modeli Grad-CAM, używam modelu bez Grad-CAM:", e);
      feat = head = null;
      model = await tf.loadGraphModel(`${BASE}/model/model.json`, { onProgress: (f: number) => onProgress?.(f) });
    }
    let labels = await lab;
    if (!Array.isArray(labels) || labels.length !== 30) labels = Array.from({ length: 30 }, (_, i) => "Klasa " + (i + 1));
    return { labels, feat, head, model };
  })().catch((e) => { enginePromise = null; throw e; }));
}

const one = (o: any) => (Array.isArray(o) ? o[0] : o);

export async function warmUp(e: Engine) {
  const tf = g().tf;
  try {
    const x = tf.zeros([1, 260, 260, 3]);
    if (e.feat) {
      const c = one(e.feat.predict(x)), o = one(e.head.predict(c));
      await o.data(); await g().gradCAM(e.head, c, 0);
      o.dispose(); c.dispose();
    } else { const o = one(e.model.predict(x)); await o.data(); o.dispose(); }
    x.dispose();
  } catch (err) { console.warn("[MRI] warm-up:", err); }
}

/** Softmax tylko jeśli wyjście nie wygląda jeszcze na prawdopodobieństwa (jak w oryginale). */
export function toProbs(raw: number[]) {
  const sum = raw.reduce((a, b) => a + b, 0);
  if (!(raw.some((v) => v < 0) || Math.abs(sum - 1) > 0.02)) return raw;
  const m = Math.max(...raw), e = raw.map((v) => Math.exp(v - m)), s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
}

export type Result = { idx: number; p: number };
/** Dokładnie ten sam przepływ co w index.html: preprocess → RGB 0..255 → model → (Grad-CAM). */
export async function runAnalysis(
  engine: Engine, img: HTMLImageElement,
  hooks: { onProcessed: (rgb: Uint8Array) => void; onTop: (top: Result[]) => void; onCamStart: () => void },
): Promise<{ rgb: Uint8Array; top: Result[]; overlay: Uint8ClampedArray | null; camFailed: boolean }> {
  const w = g(), tf = w.tf;
  let x: any = null, conv: any = null;
  try {
    const { rgb } = w.preprocessMRI(img) as { rgb: Uint8Array };
    hooks.onProcessed(rgb);
    x = tf.tensor4d(Float32Array.from(rgb), [1, w.MRI_SIZE, w.MRI_SIZE, 3]); // RGB 0..255, bez normalizacji

    let o: any;
    if (engine.feat) { conv = one(engine.feat.predict(x)); o = one(engine.head.predict(conv)); }
    else o = one(engine.model.predict(x));
    const p = toProbs(Array.from(await o.data() as Float32Array)); o.dispose();
    const top = p.map((v, i) => ({ p: v, idx: i })).sort((a, b) => b.p - a.p).slice(0, 3);
    hooks.onTop(top);

    let overlay: Uint8ClampedArray | null = null, camFailed = false;
    if (conv) {
      hooks.onCamStart();
      await tf.nextFrame();
      try {
        const cam = await w.gradCAM(engine.head, conv, top[0].idx);
        overlay = w.gradCAMOverlay(rgb, cam) as Uint8ClampedArray;
      } catch (err) { console.warn("[MRI] Grad-CAM:", err); camFailed = true; }
    }
    return { rgb, top, overlay, camFailed };
  } finally { x && x.dispose(); conv && conv.dispose(); }
}
