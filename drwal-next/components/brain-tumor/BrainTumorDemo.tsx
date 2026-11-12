"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion } from "motion/react";
import s from "./BrainTumor.module.css";
import { SAMPLES, getCV, getEngine, runAnalysis, setProgressListener, warmUp, type Engine, type Result } from "./engine";
import { classLabelPl, significance } from "@/lib/brain-tumor";
const EASE = [0.22, 1, 0.36, 1] as const;

type Phase = "boot" | "ready" | "working" | "done" | "error";
type Cam = "idle" | "loading" | "done" | "error" | "na";
const STEPS = ["Zdjęcie", "Preprocessing", "Klasyfikacja", "Grad-CAM"];

function drawRGB(canvas: HTMLCanvasElement, rgb: Uint8Array) {
  const n = rgb.length / 3, d = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) { d[i * 4] = rgb[i * 3]; d[i * 4 + 1] = rgb[i * 3 + 1]; d[i * 4 + 2] = rgb[i * 3 + 2]; d[i * 4 + 3] = 255; }
  canvas.getContext("2d")!.putImageData(new ImageData(d, 260, 260), 0, 0);
}

function Percent({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const c = animate(0, value * 100, { duration: 1.1, ease: EASE, onUpdate: (v) => { if (ref.current) ref.current.textContent = v.toFixed(1) + "%"; } });
    return () => c.stop();
  }, [value]);
  return <span ref={ref}>0.0%</span>;
}

export default function BrainTumorDemo() {
  const [phase, setPhase] = useState<Phase>("boot");
  const [status, setStatus] = useState("Ładuję model…");
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [hasImage, setHasImage] = useState(false);
  const [top, setTop] = useState<Result[] | null>(null);
  const [cam, setCam] = useState<Cam>("idle");
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  const engine = useRef<Engine | null>(null);
  const warm = useRef<Promise<void>>(Promise.resolve());
  const busy = useRef(false);
  const proc = useRef<HTMLCanvasElement | null>(null);
  const camCanvas = useRef<HTMLCanvasElement | null>(null);
  const rgbRef = useRef<Uint8Array | null>(null);
  const overlayRef = useRef<Uint8ClampedArray | null>(null);

  // Płótna montują się dopiero po animacji wyjścia pola uploadu (AnimatePresence mode="wait"),
  // więc wynik zapamiętujemy i rysujemy zawsze, gdy tylko płótno istnieje.
  const paint = useCallback(() => {
    const c = proc.current, k = camCanvas.current;
    if (c) { if (rgbRef.current) drawRGB(c, rgbRef.current); else c.getContext("2d")?.clearRect(0, 0, 260, 260); }
    if (k) { if (overlayRef.current) k.getContext("2d")!.putImageData(new ImageData(overlayRef.current as any, 260, 260), 0, 0); else k.getContext("2d")?.clearRect(0, 0, 260, 260); }
  }, []);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setProgressListener((f) => alive && setProgress(f));
        const cvP = getCV(); cvP.catch(() => {});
        setStatus("Ładuję model…");
        const e = await getEngine();
        if (!alive) return;
        engine.current = e;
        setStatus("Ładuję OpenCV…"); setProgress(1);
        await cvP;
        if (!alive) return;
        setPhase("ready"); setStatus("Model gotowy");
        warm.current = warmUp(e);
      } catch (err: any) {
        console.error(err);
        if (!alive) return;
        setPhase("error"); setStatus("Nie udało się załadować modelu.");
        setError(String(err?.message || err) + (String(err?.message || err).match(/404|fetch|network|shard|bin/i) ? " Sprawdź, czy pliki wag (.bin) są w public/models/brain-tumor/…" : ""));
      }
    })();
    return () => { alive = false; setProgressListener(null); };
  }, []);

  const analyze = useCallback(async (img: HTMLImageElement) => {
    const e = engine.current;
    if (!e || busy.current) return;
    busy.current = true;
    setHasImage(true); setTop(null); setCam("idle"); setError(null);
    rgbRef.current = null; overlayRef.current = null; paint();
    setPhase("working"); setStatus("Analizuję zdjęcie…"); setStep(1);
    try {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await getCV(); await warm.current;
      const r = await runAnalysis(e, img, {
        onProcessed: (rgb) => { rgbRef.current = rgb; paint(); setStep(2); },
        onTop: (t) => { setTop(t); setStep(3); },
        onCamStart: () => setCam("loading"),
      });
      if (r.camFailed) { setCam("error"); }
      else if (!r.overlay) { setCam("na"); }
      else {
        overlayRef.current = r.overlay; paint();
        setCam("done");
      }
      setStep(4); setPhase("done"); setStatus("Analiza zakończona");
    } catch (err: any) {
      console.error(err);
      setError(String(err?.message || err));
      setPhase("error"); setStatus("Wystąpił błąd podczas analizy");
    } finally { busy.current = false; }
  }, [paint]);

  const loadSrc = useCallback((src: string, revoke = false) => {
    const im = new Image();
    im.onload = () => { analyze(im); if (revoke) URL.revokeObjectURL(src); };
    im.onerror = () => setError("Nie udało się wczytać zdjęcia.");
    im.src = src;
  }, [analyze]);

  const loadFile = (f: File) => {
    if (!f.type.startsWith("image/")) { setError("Wybrany plik nie jest obrazem."); return; }
    loadSrc(URL.createObjectURL(f), true);
  };

  const reset = () => {
    busy.current = false; rgbRef.current = null; overlayRef.current = null; setHasImage(false); setTop(null); setCam("idle"); setStep(0); setError(null);
    if (fileInput.current) fileInput.current.value = "";
    setPhase("ready"); setStatus("Model gotowy");
  };

  const dotClass = phase === "ready" || phase === "done" ? s.ready : phase === "working" ? s.working : phase === "error" ? s.err : s.loading;
  const disabled = phase === "boot" || (phase === "error" && !engine.current);

  return (
    <div className={s.app}>
      <section className={s.panel} aria-label="Zdjęcie MRI">
        <h2>1. Zdjęcie MRI</h2>

        <AnimatePresence mode="wait" initial={false}>
          {!hasImage ? (
            <motion.div key="drop" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: EASE }}>
              <label
                className={`${s.drop} ${over ? s.over : ""} ${disabled ? s.disabled : ""}`} tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.current?.click(); } }}
                onDragEnter={(e) => { e.preventDefault(); setOver(true); }} onDragOver={(e) => { e.preventDefault(); setOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setOver(false); }}
                onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer?.files?.[0]; if (f && !disabled) loadFile(f); }}
              >
                <input ref={fileInput} type="file" accept="image/*" hidden disabled={disabled} onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
                <div>
                  <motion.svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                    animate={{ y: over ? -6 : [0, -5, 0] }} transition={over ? { duration: 0.2 } : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}>
                    <path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                  </motion.svg>
                  <strong>Przeciągnij zdjęcie tutaj</strong><small>lub kliknij, aby wybrać plik</small>
                </div>
              </label>
            </motion.div>
          ) : (
            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <div className={s.pair}>
                <motion.figure initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: EASE }}>
                  <canvas ref={(el) => { proc.current = el; if (el) paint(); }} width={260} height={260} />
                  <figcaption>Po preprocessingu</figcaption>
                </motion.figure>
                <motion.figure initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}>
                  <div className={s.cam}>
                    <canvas ref={(el) => { camCanvas.current = el; if (el) paint(); }} width={260} height={260} style={{ opacity: cam === "done" ? 1 : 0.0, transition: "opacity .8s" }} />
                    <div className={s.ph}>
                      {cam === "loading" && <span><span className={s.spin} />Liczę Grad-CAM…</span>}
                      {cam === "idle" && phase === "working" && <span className={s.shimmer} />}
                      {cam === "na" && "Grad-CAM niedostępny (brak modeli w /gradcam)"}
                      {cam === "error" && "Nie udało się wyliczyć Grad-CAM"}
                    </div>
                  </div>
                  <figcaption>Grad-CAM</figcaption>
                </motion.figure>
              </div>
              <AnimatePresence>
                {cam === "done" && (
                  <motion.div className={s.legend} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                    <i /><div><span>mniejszy wpływ na decyzję</span><span>większy wpływ</span></div>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button className={s.btn} type="button" onClick={reset} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>Wybierz inne zdjęcie</motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={s.samples}>
          <p>Albo wypróbuj przykład:</p>
          <div>
            {SAMPLES.map((sm) => (
              <motion.button key={sm.file} type="button" title={sm.label} disabled={disabled} onClick={() => loadSrc(sm.file)}
                whileHover={{ y: -3, scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sm.file} alt={sm.label} width={72} height={72} loading="lazy" />
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <section className={s.panel} aria-label="Wynik" aria-live="polite">
        <h2>2. Wynik analizy</h2>

        <div className={s.status}>
          <span className={`${s.dot} ${dotClass}`} />
          <span>{status}{phase === "boot" && progress > 0 && progress < 1 ? ` ${Math.round(progress * 100)}%` : ""}</span>
        </div>
        {phase === "boot" && <div className={s.loadbar}><motion.i animate={{ width: `${Math.max(6, progress * 100)}%` }} transition={{ duration: 0.4 }} /></div>}

        <ol className={s.steps} aria-label="Etapy analizy">
          {STEPS.map((t, i) => (
            <li key={t} className={step > i ? s.done : step === i && phase === "working" ? s.active : ""}>
              <span>{step > i ? "✓" : i + 1}</span>{t}
            </li>
          ))}
        </ol>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div key="err" className={s.errorBox} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <b>Błąd</b><br />{error}
            </motion.div>
          ) : top ? (
            <motion.div key="res" className={s.res} initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.12 } } }}>
              {top.map((r, k) => {
                const name = engine.current?.labels[r.idx] ?? "Klasa " + (r.idx + 1);
                const sig = significance(r.p);
                return (
                  <motion.div key={r.idx} className={`${s.row} ${k === 0 ? s.first : ""}`} variants={{ hidden: { opacity: 0, x: 24 }, show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } } }}>
                    <div className={s.top}>
                      <b>{k + 1}. {classLabelPl(name)} <small>{name}</small></b>
                      <span><Percent value={r.p} /></span>
                    </div>
                    <div className={s.bar}><motion.i initial={{ width: 0 }} animate={{ width: `${(r.p * 100).toFixed(1)}%` }} transition={{ duration: 1.1, ease: EASE, delay: 0.15 + k * 0.1 }} /></div>
                    {k === 0 && (
                      <div className={s.meta}>
                        <span className={s.sig} style={{ color: sig.color, borderColor: sig.color }}>Istotność: {sig.label}</span>
                        <span>Różnica Top 1 – Top 2: {((top[0].p - (top[1]?.p ?? 0)) * 100).toFixed(1)} p.p.</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.p key="empty" className={s.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {phase === "working" ? <><span className={s.spin} />Model analizuje obraz…</> : "Wybierz zdjęcie, aby rozpocząć analizę."}
            </motion.p>
          )}
        </AnimatePresence>

        <p className={s.note}>Analiza wykonywana jest lokalnie w przeglądarce. Obraz nie jest wysyłany na serwer.</p>
      </section>
    </div>
  );
}
