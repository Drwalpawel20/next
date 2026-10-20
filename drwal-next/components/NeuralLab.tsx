"use client";
import { useEffect, useRef, useState } from "react";

/* Sieć neuronowa napisana od zera, bez bibliotek. Uczy się w przeglądarce (Adam, entropia krzyżowa). */
type Pt = { x: number; y: number; l: 0 | 1 };
type Net = { sizes: number[]; W: Float64Array[]; b: Float64Array[]; mW: Float64Array[]; vW: Float64Array[]; mb: Float64Array[]; vb: Float64Array[]; t: number };
type Kind = "klastry" | "linia" | "okregi" | "ksiezyce" | "xor" | "szachownica" | "spirala";

const KINDS: { k: Kind; n: string }[] = [
  { k: "klastry", n: "Klastry" }, { k: "linia", n: "Linia" }, { k: "okregi", n: "Okręgi" }, { k: "ksiezyce", n: "Księżyce" },
  { k: "xor", n: "XOR" }, { k: "szachownica", n: "Szachownica" }, { k: "spirala", n: "Spirala" },
];
const ARCHS: { n: string; s: number[] }[] = [
  { n: "2-4-1", s: [2, 4, 1] },
  { n: "2-8-8-1", s: [2, 8, 8, 1] },
  { n: "2-16-16-1", s: [2, 16, 16, 1] },
];

const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const hex = (s: string) => { const h = s.trim().replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };

function makeNet(sizes: number[]): Net {
  const L = sizes.length - 1;
  const W: Float64Array[] = [], b: Float64Array[] = [];
  for (let l = 0; l < L; l++) {
    const i = sizes[l], o = sizes[l + 1];
    W.push(Float64Array.from({ length: i * o }, () => gauss() * Math.sqrt(2 / (i + o))));
    b.push(new Float64Array(o));
  }
  const z = (a: Float64Array[]) => a.map((x) => new Float64Array(x.length));
  return { sizes, W, b, mW: z(W), vW: z(W), mb: z(b), vb: z(b), t: 0 };
}

function fwd(n: Net, x: number, y: number): number[][] {
  const S = n.sizes, L = S.length - 1;
  const A: number[][] = [[x, y]];
  for (let l = 0; l < L; l++) {
    const i = S[l], o = S[l + 1], a = A[l], out = new Array<number>(o);
    for (let k = 0; k < o; k++) {
      let s = n.b[l][k];
      for (let j = 0; j < i; j++) s += n.W[l][k * i + j] * a[j];
      out[k] = l === L - 1 ? 1 / (1 + Math.exp(-s)) : Math.tanh(s);
    }
    A.push(out);
  }
  return A;
}

function train(n: Net, batch: Pt[], lr: number) {
  const S = n.sizes, L = S.length - 1;
  const gW = n.W.map((w) => new Float64Array(w.length)), gb = n.b.map((b) => new Float64Array(b.length));
  for (const p of batch) {
    const A = fwd(n, p.x, p.y);
    let d = [A[L][0] - p.l];
    for (let l = L - 1; l >= 0; l--) {
      const i = S[l], o = S[l + 1], nd = new Array<number>(i).fill(0);
      for (let k = 0; k < o; k++) {
        gb[l][k] += d[k];
        for (let j = 0; j < i; j++) { gW[l][k * i + j] += d[k] * A[l][j]; nd[j] += n.W[l][k * i + j] * d[k]; }
      }
      if (l > 0) for (let j = 0; j < i; j++) nd[j] *= 1 - A[l][j] * A[l][j];
      d = nd;
    }
  }
  n.t++;
  const b1 = 0.9, b2 = 0.999, c1 = 1 - Math.pow(b1, n.t), c2 = 1 - Math.pow(b2, n.t), m = batch.length;
  const upd = (P: Float64Array, G: Float64Array, M: Float64Array, V: Float64Array) => {
    for (let q = 0; q < P.length; q++) {
      const g = G[q] / m;
      M[q] = b1 * M[q] + (1 - b1) * g;
      V[q] = b2 * V[q] + (1 - b2) * g * g;
      P[q] -= (lr * (M[q] / c1)) / (Math.sqrt(V[q] / c2) + 1e-8);
    }
  };
  for (let l = 0; l < L; l++) { upd(n.W[l], gW[l], n.mW[l], n.vW[l]); upd(n.b[l], gb[l], n.mb[l], n.vb[l]); }
}

function gen(kind: Kind): Pt[] {
  const p: Pt[] = [], n = 90;
  const uni = (f: (x: number, y: number) => 0 | 1 | null, count: number) => {
    while (p.length < count) { const x = rnd(-0.95, 0.95), y = rnd(-0.95, 0.95), l = f(x, y); if (l !== null) p.push({ x, y, l }); }
  };
  if (kind === "klastry") {
    for (let i = 0; i < n; i++) { p.push({ x: -0.5 + gauss() * 0.22, y: -0.4 + gauss() * 0.22, l: 0 }); p.push({ x: 0.5 + gauss() * 0.22, y: 0.45 + gauss() * 0.22, l: 1 }); }
  } else if (kind === "linia") {
    uni((x, y) => (Math.abs(x - y * 0.6) < 0.1 ? null : x - y * 0.6 > 0 ? 1 : 0), n * 2);
  } else if (kind === "okregi") {
    for (let i = 0; i < n; i++) {
      let a = rnd(0, 6.283), r = rnd(0, 0.35); p.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, l: 1 });
      a = rnd(0, 6.283); r = rnd(0.62, 0.92); p.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, l: 0 });
    }
  } else if (kind === "ksiezyce") {
    for (let i = 0; i < n; i++) {
      let t = rnd(0, Math.PI);
      p.push({ x: 0.6 * Math.cos(t) - 0.3 + gauss() * 0.05, y: 0.6 * Math.sin(t) - 0.25 + gauss() * 0.05, l: 0 });
      t = rnd(0, Math.PI);
      p.push({ x: 0.3 - 0.6 * Math.cos(t) + gauss() * 0.05, y: 0.05 - 0.6 * Math.sin(t) + gauss() * 0.05, l: 1 });
    }
  } else if (kind === "xor") {
    uni((x, y) => (Math.abs(x) < 0.12 || Math.abs(y) < 0.12 ? null : x * y > 0 ? 1 : 0), n * 2);
  } else if (kind === "szachownica") {
    uni((x, y) => ((Math.floor(x * 2 + 2) + Math.floor(y * 2 + 2)) % 2 === 0 ? 1 : 0), n * 3);
  } else {
    for (let i = 0; i < n; i++) {
      const r = (i / n) * 0.92, t = (i / n) * 3.5 * Math.PI;
      for (const c of [0, 1] as const) { const a = t + c * Math.PI; p.push({ x: r * Math.sin(a) + gauss() * 0.03, y: r * Math.cos(a) + gauss() * 0.03, l: c }); }
    }
  }
  return p;
}
const sample = (a: Pt[], n: number) => Array.from({ length: Math.min(n, a.length) }, () => a[(Math.random() * a.length) | 0]);

const layerX = (l: number, count: number) => 36 + (l * 288) / Math.max(1, count - 1);
const nodeY = (n: number, j: number) => 104 + (j - (n - 1) / 2) * Math.min(24, 180 / n);

export default function NeuralLab() {
  const cv = useRef<HTMLCanvasElement>(null);
  const net = useRef<Net | null>(null);
  const pts = useRef<Pt[]>([]);
  const run = useRef(true);
  const dirty = useRef(true);
  const cls = useRef<0 | 1>(1);
  const probe = useRef({ x: 0, y: 0, on: false });
  const ripples = useRef<{ x: number; y: number; t: number }[]>([]);
  const painted = useRef(false);
  const last = useRef({ x: 9, y: 9 });
  const api = useRef({ data: (_k: Kind, _a: number) => {}, arch: (_a: number) => {}, clear: () => {} });
  const [kind, setKind] = useState<Kind>("klastry");
  const [arch, setArch] = useState(1);
  const [running, setRunning] = useState(true);
  const [add, setAdd] = useState<0 | 1>(1);
  const [stats, setStats] = useState({ t: 0, loss: 0, acc: 0, n: 0 });
  const [view, setView] = useState<{ W: number[][]; act: number[][]; sizes: number[] } | null>(null);

  useEffect(() => {
    const c = cv.current!, ctx = c.getContext("2d")!;
    const G = 40, off = document.createElement("canvas");
    off.width = off.height = G;
    const octx = off.getContext("2d")!, img = octx.createImageData(G, G);
    const W = c.width, H = c.height;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { run.current = false; setRunning(false); }
    const readAccent = () => hex(getComputedStyle(document.documentElement).getPropertyValue("--accent") || "#5b86ff");
    let accent = readAccent();
    const sx = (x: number) => ((Math.max(-1, Math.min(1, x)) + 1) / 2) * W;
    const sy = (y: number) => ((Math.max(-1, Math.min(1, y)) + 1) / 2) * H;

    const draw = () => {
      const n = net.current!, L = n.sizes.length - 1;
      for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
        const p = fwd(n, ((i + 0.5) / G) * 2 - 1, ((j + 0.5) / G) * 2 - 1)[L][0], k = (j * G + i) * 4;
        img.data[k] = 34 + (accent[0] * 0.75 - 34) * p;
        img.data[k + 1] = 37 + (accent[1] * 0.75 - 37) * p;
        img.data[k + 2] = 54 + (accent[2] * 0.75 - 54) * p;
        img.data[k + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, W, H);
      for (const p of pts.current) {
        ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), 6, 0, 6.283);
        ctx.fillStyle = p.l ? `rgb(${accent})` : "#eef0f5"; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = "rgba(5,6,12,.9)"; ctx.stroke();
      }
      const now = performance.now();
      ripples.current = ripples.current.filter((r) => now - r.t < 650);
      for (const r of ripples.current) {
        const a = (now - r.t) / 650;
        ctx.beginPath(); ctx.arc(sx(r.x), sy(r.y), 8 + a * 30, 0, 6.283);
        ctx.lineWidth = 2; ctx.strokeStyle = `rgba(255,255,255,${1 - a})`; ctx.stroke();
      }
      if (probe.current.on) {
        ctx.beginPath(); ctx.arc(sx(probe.current.x), sy(probe.current.y), 12, 0, 6.283);
        ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.stroke();
      }
    };

    const snap = () => {
      const n = net.current!, L = n.sizes.length - 1;
      let loss = 0, ok = 0;
      for (const p of pts.current) {
        const a = fwd(n, p.x, p.y)[L][0], q = Math.min(1 - 1e-7, Math.max(1e-7, a));
        loss -= p.l ? Math.log(q) : Math.log(1 - q);
        if ((a > 0.5 ? 1 : 0) === p.l) ok++;
      }
      const m = Math.max(1, pts.current.length);
      setStats({ t: n.t, loss: loss / m, acc: ok / m, n: pts.current.length });
      setView({ W: n.W.map((w) => Array.from(w)), act: fwd(n, probe.current.x, probe.current.y), sizes: n.sizes });
    };

    api.current.data = (k, a) => { pts.current = gen(k); net.current = makeNet(ARCHS[a].s); dirty.current = true; draw(); snap(); };
    api.current.arch = (a) => { net.current = makeNet(ARCHS[a].s); dirty.current = true; draw(); snap(); };
    api.current.clear = () => { pts.current = []; dirty.current = true; draw(); snap(); };
    api.current.data("klastry", 1);

    let raf = 0, f = 0;
    const frame = () => {
      f++;
      if (run.current && pts.current.length) for (let s = 0; s < 3; s++) train(net.current!, sample(pts.current, 32), 0.03);
      if (ripples.current.length) dirty.current = true;
      if ((run.current || dirty.current) && f % 2 === 0) { draw(); dirty.current = false; }
      if (f % 12 === 0 && (run.current || dirty.current)) snap();
      raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(([e]) => { cancelAnimationFrame(raf); if (e.isIntersecting) raf = requestAnimationFrame(frame); });
    io.observe(c);
    const mo = new MutationObserver(() => { accent = readAccent(); dirty.current = true; });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => { cancelAnimationFrame(raf); io.disconnect(); mo.disconnect(); };
  }, []);

  const pos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 };
  };
  const addPt = (p: { x: number; y: number }) => {
    if (pts.current.length > 500) pts.current.shift();
    pts.current.push({ x: p.x, y: p.y, l: cls.current });
    ripples.current.push({ x: p.x, y: p.y, t: performance.now() });
    dirty.current = true;
  };

  const sizes = view?.sizes ?? ARCHS[arch].s;
  const nn = sizes.length;
  const labels = sizes.map((_, l) => (l === 0 ? "wejście" : l === nn - 1 ? "wyjście" : "ukryta"));
  const rNode = Math.max(...sizes) > 10 ? 4.5 : 7;

  return (
    <section id="lab">
      <div className="wrap">
        <div className="sh"><h2>Sieć neuronowa na żywo</h2><span className="sh-line" /></div>
        <p className="sub">Napisana od zera w JavaScripcie, bez bibliotek. Wybierz zbiór danych i rozmiar sieci, kliknij albo przeciągnij po wykresie, żeby dodać punkty, i patrz, jak sieć poprawia granicę.</p>
        <div className="lab">
          <div className="lab-l">
            <p className="lab-h">Zbiór danych</p>
            <div className="lab-ctl" role="group" aria-label="Zbiór danych">
              {KINDS.map((x) => (
                <button key={x.k} aria-pressed={kind === x.k} onClick={() => { setKind(x.k); api.current.data(x.k, arch); }}>{x.n}</button>
              ))}
            </div>
            <p className="lab-h">Rozmiar sieci</p>
            <div className="lab-ctl" role="group" aria-label="Rozmiar sieci">
              {ARCHS.map((x, i) => (
                <button key={x.n} aria-pressed={arch === i} onClick={() => { setArch(i); api.current.arch(i); }}>{x.n}</button>
              ))}
            </div>
            <svg viewBox="0 0 360 220" className="net" role="img" aria-label={`Schemat sieci ${ARCHS[arch].n}`}>
              {view && view.W.map((w, l) => w.map((v, idx) => {
                const i = view.sizes[l], o = Math.floor(idx / i), j = idx % i, a = Math.abs(v);
                return <line key={`${l}-${idx}`} className={"e" + (a > 0.9 ? " fl" : "")}
                  x1={layerX(l, nn)} y1={nodeY(i, j)} x2={layerX(l + 1, nn)} y2={nodeY(view.sizes[l + 1], o)}
                  stroke={v > 0 ? "var(--accent)" : "#ff6b81"} strokeOpacity={Math.min(0.85, 0.06 + a * 0.3)} strokeWidth={0.5 + Math.min(2, a)} />;
              }))}
              {sizes.map((n, l) => Array.from({ length: n }, (_, j) => (
                <circle key={`${l}-${j}`} cx={layerX(l, nn)} cy={nodeY(n, j)} r={rNode} fill="var(--accent)"
                  fillOpacity={0.1 + (view && view.act[l] ? Math.abs(view.act[l][j]) : 0) * 0.9} stroke="var(--line2)" />
              )))}
              {labels.map((t, l) => <text key={l} x={layerX(l, nn)} y={214} fontSize="10" textAnchor="middle" fill="var(--muted2)">{t}</text>)}
            </svg>
            <dl className="lab-stats">
              <div><dd>{stats.t}</dd><dt>kroków</dt></div>
              <div><dd>{stats.n}</dd><dt>punktów</dt></div>
              <div><dd>{stats.loss.toFixed(2)}</dd><dt>strata</dt></div>
              <div><dd>{Math.round(stats.acc * 100)}%</dd><dt>trafność</dt></div>
            </dl>
          </div>
          <div className="lab-r">
            <canvas
              ref={cv} width={440} height={440} className="lab-cv" aria-label="Granica decyzji sieci. Kliknij, żeby dodać punkt."
              onPointerDown={() => { painted.current = false; last.current = { x: 9, y: 9 }; }}
              onPointerMove={(e) => {
                const p = pos(e);
                probe.current = { ...p, on: true }; dirty.current = true;
                if (e.pointerType === "mouse" && e.buttons === 1 && Math.hypot(p.x - last.current.x, p.y - last.current.y) > 0.07) {
                  addPt(p); last.current = p; painted.current = true;
                }
              }}
              onPointerLeave={() => { probe.current = { x: 0, y: 0, on: false }; dirty.current = true; }}
              onClick={(e) => { if (painted.current) { painted.current = false; return; } addPt(pos(e)); }}
            />
            <div className="lab-ctl lab-bar">
              <span className="lab-add">Dodajesz:</span>
              <button aria-pressed={add === 1} onClick={() => { cls.current = 1; setAdd(1); }}><i className="dot" style={{ background: "var(--accent)" }} />kolorowe</button>
              <button aria-pressed={add === 0} onClick={() => { cls.current = 0; setAdd(0); }}><i className="dot" style={{ background: "#eef0f5" }} />białe</button>
            </div>
            <div className="lab-ctl lab-bar">
              <button onClick={() => { run.current = !run.current; setRunning(run.current); }}>{running ? "Pauza" : "Wznów"}</button>
              <button onClick={() => api.current.data(kind, arch)}>Zacznij od nowa</button>
              <button onClick={() => api.current.clear()}>Wyczyść punkty</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
