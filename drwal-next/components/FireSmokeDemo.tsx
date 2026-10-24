"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { InferenceSession } from "onnxruntime-web";

type Box = { x: number; y: number; w: number; h: number; score: number; cls: number };

const SIZE = 640;
const IOU_THRESHOLD = 0.45;
const CLASSES = ["Smoke", "Fire"];
const DEMO_VIDEO = "/videos/demo_yolo_vid_1.mp4";
const DETECT_EVERY_MS = 250;

function iou(a: Box, b: Box) {
  const x1 = Math.max(a.x, b.x),
    y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w),
    y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  return inter / (a.w * a.h + b.w * b.h - inter + 1e-6);
}

function decode(
  data: Float32Array,
  width: number,
  height: number,
  scale: number,
  padX: number,
  padY: number,
  threshold: number
): Box[] {
  const count = 8400;
  const candidates: Box[] = [];
  for (let i = 0; i < count; i++) {
    const smoke = data[4 * count + i];
    const fire = data[5 * count + i];
    const score = Math.max(smoke, fire);
    if (score < threshold) continue;
    const cls = fire > smoke ? 1 : 0;
    const cx = data[i],
      cy = data[count + i],
      bw = data[2 * count + i],
      bh = data[3 * count + i];
    const x = Math.max(0, Math.min(width, (cx - bw / 2 - padX) / scale));
    const y = Math.max(0, Math.min(height, (cy - bh / 2 - padY) / scale));
    const x2 = Math.max(0, Math.min(width, (cx + bw / 2 - padX) / scale));
    const y2 = Math.max(0, Math.min(height, (cy + bh / 2 - padY) / scale));
    if (x2 > x && y2 > y) candidates.push({ x, y, w: x2 - x, h: y2 - y, score, cls });
  }
  candidates.sort((a, b) => b.score - a.score);
  const kept: Box[] = [];
  for (const box of candidates) {
    if (kept.every((o) => o.cls !== box.cls || iou(box, o) < IOU_THRESHOLD)) kept.push(box);
    if (kept.length >= 50) break;
  }
  return kept;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

async function isValidMp4(blob: Blob) {
  if (blob.size < 10_000) return false;
  const h = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  return h[4] === 0x66 && h[5] === 0x74 && h[6] === 0x79 && h[7] === 0x70;
}

/** Pobiera cały plik do pamięci i zwraca gotowy blob URL */
async function loadVideoToMemory(url: string): Promise<{ objectUrl: string; file: File }> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer(); // cały plik w RAM
  const blob = new Blob([buf], { type: "video/mp4" });
  if (!(await isValidMp4(blob))) {
    throw new Error(`Plik demo jest nieprawidłowy (${blob.size} B).`);
  }
  const file = new File([blob], "demo_yolo_vid_1.mp4", { type: "video/mp4" });
  return { objectUrl: URL.createObjectURL(blob), file };
}

export default function FireSmokeDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<InferenceSession | null>(null);
  const ortRef = useRef<(typeof import("onnxruntime-web") | typeof import("onnxruntime-web/webgpu")) | null>(null);
  const sessionPromiseRef = useRef<Promise<void> | null>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputBufRef = useRef<Float32Array | null>(null);
  const lastBoxesRef = useRef<Box[]>([]);
  const rafRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const lastRunRef = useRef(0);

  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [aspect, setAspect] = useState(16 / 9);
  const [confidence, setConfidence] = useState(0.1);
  const confidenceRef = useRef(0.1);
  const [loading, setLoading] = useState(false);
  const [modelState, setModelState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [modelError, setModelError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState("Wybierz nagranie, aby rozpocząć");
  const [stats, setStats] = useState({ count: 0, top: 0, latency: 0 });

  const clearLoop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const ensureSession = useCallback(() => {
    if (sessionRef.current && ortRef.current) {
      setModelState("ready");
      setStatus("Model gotowy. Możesz uruchomić analizę.");
      return Promise.resolve();
    }
    if (sessionPromiseRef.current) return sessionPromiseRef.current;

    setModelState("loading");
    setModelError("");
    setStatus("Przygotowujemy model do analizy. Pierwsze ładowanie może potrwać chwilę.");

    const task = (async () => {
      const res = await fetch("/models/fire-smoke-yolo26s.onnx", { cache: "force-cache" });
      if (!res.ok) throw new Error(`Model ONNX nie został pobrany (HTTP ${res.status}).`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (bytes.byteLength < 1024 * 1024) {
        const preview = new TextDecoder().decode(bytes.subarray(0, 200));
        if (preview.includes("git-lfs.github.com/spec")) {
          throw new Error("Serwer zwrócił wskaźnik Git LFS zamiast modelu ONNX.");
        }
        throw new Error(`Pobrany model jest niepełny (${bytes.byteLength} B).`);
      }
      if (bytes[0] !== 0x08) throw new Error("Pobrany plik nie wygląda na model ONNX.");

      if ("gpu" in navigator) {
        try {
          const ort = await import("onnxruntime-web/webgpu");
          ort.env.wasm.wasmPaths = "/ort/";
          ort.env.webgpu.powerPreference = "high-performance";
          sessionRef.current = await ort.InferenceSession.create(bytes, {
            executionProviders: ["webgpu", "wasm"],
          });
          ortRef.current = ort;
        } catch {
          /* CPU fallback */
        }
      }
      if (!sessionRef.current) {
        const ort = await import("onnxruntime-web");
        ort.env.wasm.wasmPaths = "/ort/";
        ort.env.wasm.proxy = false;
        sessionRef.current = await ort.InferenceSession.create(bytes, {
          executionProviders: ["wasm"],
        });
        ortRef.current = ort;
      }
      if (!sessionRef.current || !ortRef.current) throw new Error("Nie udało się uruchomić silnika ONNX.");
      inputBufRef.current = new Float32Array(3 * SIZE * SIZE);
    })()
      .then(() => {
        setModelState("ready");
        setStatus("Model gotowy. Możesz uruchomić analizę.");
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Nie udało się przygotować modelu.";
        setModelState("error");
        setModelError(msg);
        setStatus("Nie udało się przygotować modelu.");
        throw err;
      })
      .finally(() => {
        sessionPromiseRef.current = null;
      });

    sessionPromiseRef.current = task;
    return task;
  }, []);

  const chooseFile = useCallback(
    (file?: File, existingUrl?: string) => {
      if (!file) return;
      if (!file.type.startsWith("video/")) {
        setStatus("Wybierz plik wideo, np. MP4, WebM lub MOV.");
        return;
      }
      clearLoop();
      videoRef.current?.pause();
      if (fileUrl.startsWith("blob:")) URL.revokeObjectURL(fileUrl);

      const url = existingUrl ?? URL.createObjectURL(file);
      setFileUrl(url);
      setFileName(file.name);
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setStats({ count: 0, top: 0, latency: 0 });
      lastBoxesRef.current = [];
      void ensureSession().catch(() => {});
    },
    [clearLoop, ensureSession, fileUrl]
  );

  /** Demo: cały plik → RAM → dopiero potem odtwarzanie */
  const loadDemoVideo = useCallback(async () => {
    setStatus("Wczytywanie nagrania do pamięci…");
    const { objectUrl, file } = await loadVideoToMemory(DEMO_VIDEO);
    chooseFile(file, objectUrl);
    setStatus("Nagranie gotowe w pamięci.");
  }, [chooseFile]);

  const drawBoxes = (ctx: CanvasRenderingContext2D, boxes: Box[], w: number, h: number) => {
    ctx.clearRect(0, 0, w, h);
    if (!boxes.length) return;
    const ratio = Math.max(1, w / 960);
    ctx.lineWidth = 3 * ratio;
    ctx.font = `600 ${Math.round(16 * ratio)}px system-ui, sans-serif`;
    for (const box of boxes) {
      const color = box.cls === 1 ? "#ff634f" : "#61d7ff";
      const label = `${CLASSES[box.cls]} ${(box.score * 100).toFixed(0)}%`;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.strokeRect(box.x, box.y, box.w, box.h);
      const lw = ctx.measureText(label).width + 16;
      const lh = 27 * ratio;
      const ly = Math.max(0, box.y - lh);
      ctx.fillRect(box.x, ly, lw, lh);
      ctx.fillStyle = "#08101b";
      ctx.fillText(label, box.x + 8 * ratio, ly + 19 * ratio);
    }
  };

  const detect = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || busyRef.current || video.paused) return;

    busyRef.current = true;
    const t0 = performance.now();
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) {
      busyRef.current = false;
      return;
    }
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      busyRef.current = false;
      return;
    }

    try {
      await ensureSession();
      const ort = ortRef.current;
      const session = sessionRef.current;
      if (!ort || !session) throw new Error("Sesja modelu nie jest gotowa.");

      if (!frameCanvasRef.current) {
        frameCanvasRef.current = document.createElement("canvas");
        frameCanvasRef.current.width = SIZE;
        frameCanvasRef.current.height = SIZE;
      }
      const frame = frameCanvasRef.current;
      const fctx = frame.getContext("2d", { willReadFrequently: true });
      if (!fctx) throw new Error("Nie udało się przygotować klatki.");

      const scale = Math.min(SIZE / w, SIZE / h);
      const dw = Math.round(w * scale);
      const dh = Math.round(h * scale);
      const padX = (SIZE - dw) / 2;
      const padY = (SIZE - dh) / 2;

      fctx.fillStyle = "rgb(114,114,114)";
      fctx.fillRect(0, 0, SIZE, SIZE);
      fctx.drawImage(video, padX, padY, dw, dh);

      const rgba = fctx.getImageData(0, 0, SIZE, SIZE).data;
      let input = inputBufRef.current;
      if (!input) {
        input = new Float32Array(3 * SIZE * SIZE);
        inputBufRef.current = input;
      }
      const plane = SIZE * SIZE;
      const inv = 1 / 255;
      for (let i = 0, p = 0; i < plane; i++, p += 4) {
        input[i] = rgba[p] * inv;
        input[plane + i] = rgba[p + 1] * inv;
        input[plane * 2 + i] = rgba[p + 2] * inv;
      }

      const tensor = new ort.Tensor("float32", input, [1, 3, SIZE, SIZE]);
      const result = await session.run({ [session.inputNames[0]]: tensor });
      const boxes = decode(
        result[session.outputNames[0]].data as Float32Array,
        w,
        h,
        scale,
        padX,
        padY,
        confidenceRef.current
      );

      lastBoxesRef.current = boxes;
      drawBoxes(ctx, boxes, w, h);

      setStats({
        count: boxes.length,
        top: boxes[0]?.score ?? 0,
        latency: performance.now() - t0,
      });
      setStatus(boxes.length ? "Detekcja aktywna" : "Analiza trwa · nie wykryto obiektów w tej klatce");
    } catch (err) {
      clearLoop();
      video.pause();
      setPlaying(false);
      setStatus(err instanceof Error ? `Błąd modelu: ${err.message}` : "Nie udało się uruchomić modelu.");
    } finally {
      busyRef.current = false;
    }
  }, [clearLoop, ensureSession]);

  const tick = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video || video.paused || video.ended) {
        rafRef.current = null;
        return;
      }
      if (time - lastRunRef.current >= DETECT_EVERY_MS && !busyRef.current) {
        lastRunRef.current = time;
        void detect();
      }
      rafRef.current = requestAnimationFrame(tick);
    },
    [detect]
  );

  const start = async () => {
    const video = videoRef.current;
    if (!video || !fileUrl || modelState !== "ready" || !sessionRef.current) return;
    setLoading(true);
    setStatus("Start…");
    try {
      // upewnij się, że wideo jest w pełni w buforze
      if (video.readyState < 3) {
        await new Promise<void>((resolve, reject) => {
          const ok = () => {
            cleanup();
            resolve();
          };
          const bad = () => {
            cleanup();
            reject(new Error("Wideo nie jest gotowe."));
          };
          const cleanup = () => {
            video.removeEventListener("canplaythrough", ok);
            video.removeEventListener("error", bad);
          };
          video.addEventListener("canplaythrough", ok, { once: true });
          video.addEventListener("error", bad, { once: true });
          if (video.readyState >= 3) {
            cleanup();
            resolve();
          }
        });
      }
      await video.play();
      setPlaying(true);
      clearLoop();
      lastRunRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      setStatus(
        err instanceof Error
          ? `Nie udało się odtworzyć: ${err.name} — ${err.message}`
          : "Nie udało się odtworzyć nagrania."
      );
    } finally {
      setLoading(false);
    }
  };

  const stop = () => {
    clearLoop();
    videoRef.current?.pause();
    setPlaying(false);
    setStatus("Analiza wstrzymana");
  };

  // Auto-load demo (cały plik do RAM)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadDemoVideo();
      } catch (err) {
        if (!cancelled) {
          setStatus(
            err instanceof Error
              ? `Nie udało się wczytać demo: ${err.message}`
              : "Nie udało się wczytać przykładowego nagrania."
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadDemoVideo]);

  // Autoplay po załadowaniu demo + modelu
  useEffect(() => {
    if (fileName !== "demo_yolo_vid_1.mp4" || !fileUrl || modelState !== "ready") return;
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    (async () => {
      try {
        if (video.readyState < 3) {
          await new Promise<void>((resolve, reject) => {
            const ok = () => {
              cleanup();
              resolve();
            };
            const bad = () => {
              cleanup();
              reject();
            };
            const cleanup = () => {
              video.removeEventListener("canplaythrough", ok);
              video.removeEventListener("error", bad);
            };
            video.addEventListener("canplaythrough", ok, { once: true });
            video.addEventListener("error", bad, { once: true });
            if (video.readyState >= 3) {
              cleanup();
              resolve();
            }
          });
        }
        if (cancelled) return;
        video.muted = true;
        await video.play();
      } catch {
        if (!cancelled) setStatus("Film wczytany. Kliknij ▶, aby rozpocząć analizę.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileName, fileUrl, modelState]);

  return (
    <section className="fire-demo wrap" aria-labelledby="fire-title">
      <a className="demo-back" href="/demos">
        ← Wszystkie dema
      </a>
      <div className="fire-intro">
        <p className="demo-kicker">
          <i className="live" /> YOLO26S · DETEKCJA WIDEO
        </p>
        <h1 id="fire-title">
          Ogień i dym<span className="accent">.</span>
        </h1>
        <p>
          Wybierz własne nagranie. Model wykrywa ogień i dym bezpośrednio w przeglądarce, a plik pozostaje na Twoim
          urządzeniu.
        </p>
      </div>
      <div className="fire-layout">
        <div className="fire-main">
          <label
            className="fire-upload"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              chooseFile(e.dataTransfer.files[0]);
            }}
          >
            <input type="file" accept="video/*" onChange={(e) => chooseFile(e.target.files?.[0])} />
            <span className="upload-icon">↥</span>
            <span>
              <b>{fileName || "Wybierz lub upuść nagranie"}</b>
              <small>MP4, WebM, MOV · plik przetwarzany lokalnie</small>
            </span>
            <span className="btn">Przeglądaj pliki</span>
          </label>

          <div className="fire-confidence">
            <label htmlFor="fire-confidence">
              Pewność detekcji <b>{Math.round(confidence * 100)}%</b>
            </label>
            <input
              id="fire-confidence"
              type="range"
              min="5"
              max="80"
              step="5"
              value={Math.round(confidence * 100)}
              onChange={(e) => {
                const v = Number(e.target.value) / 100;
                confidenceRef.current = v;
                setConfidence(v);
              }}
            />
            <small>Minimalna pewność wykrycia obiektu</small>
          </div>

          <div className="fire-stage" style={{ aspectRatio: aspect }}>
            {fileUrl ? (
              <>
                <video
                  key={fileUrl}
                  ref={videoRef}
                  src={fileUrl}
                  playsInline
                  muted
                  preload="auto"
                  onError={(e) => {
                    const err = e.currentTarget.error;
                    setStatus(`Nie udało się wczytać filmu. ${err?.message || `Kod: ${err?.code ?? "?"}`}`);
                  }}
                  onLoadedMetadata={(e) => {
                    setAspect(e.currentTarget.videoWidth / e.currentTarget.videoHeight || 16 / 9);
                    setDuration(e.currentTarget.duration || 0);
                  }}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onSeeked={() => {
                    if (sessionRef.current && videoRef.current?.paused) void detect();
                  }}
                  onPlay={(e) => {
                    if (modelState !== "ready" || !sessionRef.current) {
                      e.currentTarget.pause();
                      return;
                    }
                    setPlaying(true);
                    clearLoop();
                    lastRunRef.current = 0;
                    rafRef.current = requestAnimationFrame(tick);
                  }}
                  onEnded={() => {
                    clearLoop();
                    setPlaying(false);
                    setStatus("Analiza zakończona");
                  }}
                  onPause={() => {
                    clearLoop();
                    setPlaying(false);
                  }}
                />
                <canvas ref={canvasRef} aria-label="Klatka wideo z zaznaczonymi detekcjami ognia i dymu" />
              </>
            ) : (
              <div className="fire-empty">
                <span>▶</span>
                <b>Podgląd nagrania</b>
                <small>Wybierz plik wideo, aby zobaczyć detekcje</small>
              </div>
            )}
          </div>

          {fileUrl && (
            <div className="fire-player" aria-label="Sterowanie nagraniem">
              <button
                className="fire-player-toggle"
                type="button"
                onClick={playing ? stop : start}
                disabled={loading || modelState !== "ready"}
                aria-label={playing ? "Wstrzymaj analizę" : "Uruchom analizę"}
              >
                {playing ? "Ⅱ" : "▶"}
              </button>
              <span className="fire-player-time">{formatTime(currentTime)}</span>
              <input
                className="fire-seek"
                type="range"
                min="0"
                max={Math.max(duration, 0.01)}
                step="0.01"
                value={Math.min(currentTime, duration || 0)}
                aria-label="Pozycja nagrania"
                onChange={(e) => {
                  const t = Number(e.target.value);
                  if (videoRef.current) videoRef.current.currentTime = t;
                  setCurrentTime(t);
                }}
              />
              <span className="fire-player-time">{formatTime(duration)}</span>
            </div>
          )}

          <div className="fire-controls">
            <span className="fire-status">
              <i className={playing ? "live" : ""} />
              {loading ? "Uruchamianie…" : status}
            </span>
          </div>

          {modelState === "loading" && (
            <p className="fire-model-note" role="status">
              Przygotowanie modelu może potrwać chwilę. Analizę będzie można uruchomić po zakończeniu.
            </p>
          )}
          {modelState === "error" && (
            <div className="fire-model-error">
              <p>{modelError}</p>
              <button className="btn" type="button" onClick={() => void ensureSession().catch(() => {})}>
                Ponów przygotowanie modelu
              </button>
            </div>
          )}

          <div className="fire-examples">
            <div>
              <h2>Przykładowe nagrania</h2>
              <p>Uruchom demonstrację detekcji ognia i dymu na przykładowym nagraniu.</p>
            </div>
            <button
              className="btn"
              type="button"
              onClick={async () => {
                clearLoop();
                videoRef.current?.pause();
                setPlaying(false);
                setCurrentTime(0);
                setDuration(0);
                setStats({ count: 0, top: 0, latency: 0 });
                lastBoxesRef.current = [];
                try {
                  await loadDemoVideo();
                } catch (err) {
                  setStatus(
                    err instanceof Error
                      ? `Nie udało się załadować: ${err.message}`
                      : "Nie udało się załadować przykładowego filmu."
                  );
                }
              }}
            >
              ▶ Uruchom przykład
            </button>
          </div>
        </div>

        <aside className="fire-side">
          <p className="fire-side-label">WYNIK NA ŻYWO</p>
          <div className="fire-metric">
            <span>Boxy na klatce wideo</span>
            <b>{stats.count}</b>
          </div>
          <div className="fire-metric">
            <span>Najwyższa pewność</span>
            <b>{stats.top ? `${(stats.top * 100).toFixed(1)}%` : "—"}</b>
          </div>
          <div className="fire-metric">
            <span>Czas inferencji</span>
            <b>{stats.latency ? `${stats.latency.toFixed(0)} ms` : "—"}</b>
          </div>
          <div className="fire-legend">
            <span>
              <i className="fire-dot" /> Ogień
            </span>
            <span>
              <i className="smoke-dot" /> Dym
            </span>
          </div>
          <p className="fire-disclaimer">
            Demo edukacyjne. Wynik modelu nie zastępuje alarmu przeciwpożarowego ani oceny służb ratunkowych.
          </p>
        </aside>
      </div>
    </section>
  );
}
