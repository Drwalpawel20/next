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

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

async function isValidMp4(blob: Blob) {
  if (blob.size < 10_000) return false;
  const h = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  return h[4] === 0x66 && h[5] === 0x74 && h[6] === 0x79 && h[7] === 0x70;
}

/** Pobiera cały plik z progressem → jeden blob URL */
async function fetchToMemory(
  url: string,
  onProgress: (loaded: number, total: number) => void
): Promise<Blob> {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const total = Number(res.headers.get("content-length")) || 0;
  if (!res.body) {
    const buf = await res.arrayBuffer();
    onProgress(buf.byteLength, buf.byteLength);
    return new Blob([buf], { type: "video/mp4" });
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onProgress(loaded, total || loaded);
  }

  const merged = new Uint8Array(loaded);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return new Blob([merged], { type: "video/mp4" });
}

export default function FireSmokeDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<InferenceSession | null>(null);
  const ortRef = useRef<(typeof import("onnxruntime-web") | typeof import("onnxruntime-web/webgpu")) | null>(null);
  const sessionPromiseRef = useRef<Promise<void> | null>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const inputBufRef = useRef<Float32Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const lastRunRef = useRef(0);
  const blobUrlRef = useRef<string>(""); // jeden URL – bez spamowania

  const [fileUrl, setFileUrl] = useState(""); // puste = nie pokazuj <video>
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
  const [status, setStatus] = useState("Przygotowanie…");
  const [stats, setStats] = useState({ count: 0, top: 0, latency: 0 });

  // progress ładowania wideo
  const [videoProgress, setVideoProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [bootPhase, setBootPhase] = useState<"model" | "video" | "ready" | "error">("model");

  const clearLoop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = "";
    }
  }, []);

  const ensureSession = useCallback(() => {
    if (sessionRef.current && ortRef.current) {
      setModelState("ready");
      return Promise.resolve();
    }
    if (sessionPromiseRef.current) return sessionPromiseRef.current;

    setModelState("loading");
    setModelError("");
    setBootPhase("model");
    setStatus("Ładowanie modelu…");

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
          /* CPU */
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
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Nie udało się przygotować modelu.";
        setModelState("error");
        setModelError(msg);
        setBootPhase("error");
        setStatus("Nie udało się przygotować modelu.");
        throw err;
      })
      .finally(() => {
        sessionPromiseRef.current = null;
      });

    sessionPromiseRef.current = task;
    return task;
  }, []);

  /** Użytkownik wybiera własny plik – od razu w pamięci */
  const chooseFile = useCallback(
    (file?: File) => {
      if (!file) return;
      if (!file.type.startsWith("video/")) {
        setStatus("Wybierz plik wideo, np. MP4, WebM lub MOV.");
        return;
      }
      clearLoop();
      videoRef.current?.pause();
      revokeBlob();

      const url = URL.createObjectURL(file);
      blobUrlRef.current = url;
      setFileUrl(url);
      setFileName(file.name);
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setStats({ count: 0, top: 0, latency: 0 });
      setVideoProgress(null);
      setBootPhase("ready");
      setStatus("Nagranie gotowe.");
      void ensureSession().catch(() => {});
    },
    [clearLoop, ensureSession, revokeBlob]
  );

  /** Demo: model → wideo do RAM (z progressem) → dopiero wtedy <video> */
  const bootDemo = useCallback(async () => {
    try {
      // 1) Model
      setBootPhase("model");
      setStatus("Ładowanie modelu…");
      setVideoProgress(null);
      setFileUrl(""); // ukryj player
      await ensureSession();

      // 2) Wideo w całości do pamięci
      setBootPhase("video");
      setStatus("Pobieranie nagrania…");
      const blob = await fetchToMemory(DEMO_VIDEO, (loaded, total) => {
        setVideoProgress({ loaded, total });
        if (total > 0) {
          const pct = Math.min(100, Math.round((loaded / total) * 100));
          setStatus(`Pobieranie nagrania… ${pct}%`);
        } else {
          setStatus(`Pobieranie nagrania… ${formatBytes(loaded)}`);
        }
      });

      if (!(await isValidMp4(blob))) {
        throw new Error(`Plik demo jest nieprawidłowy (${blob.size} B).`);
      }

      revokeBlob();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;

      setFileUrl(url);
      setFileName("demo_yolo_vid_1.mp4");
      setVideoProgress(null);
      setBootPhase("ready");
      setStatus("Gotowe. Uruchamianie…");
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setStats({ count: 0, top: 0, latency: 0 });
    } catch (err) {
      setBootPhase("error");
      setStatus(err instanceof Error ? err.message : "Błąd ładowania demo.");
    }
  }, [ensureSession, revokeBlob]);

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

      drawBoxes(ctx, boxes, w, h);
      setStats({ count: boxes.length, top: boxes[0]?.score ?? 0, latency: performance.now() - t0 });
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
    try {
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

  // Boot: model → wideo → player
  useEffect(() => {
    void bootDemo();
    return () => {
      clearLoop();
      revokeBlob();
    };
  }, [bootDemo, clearLoop, revokeBlob]);

  // Autoplay dopiero gdy fileUrl + model ready + video can play
  useEffect(() => {
    if (!fileUrl || modelState !== "ready" || fileName !== "demo_yolo_vid_1.mp4") return;
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
              reject(new Error("Wideo nie gotowe"));
            };
            const cleanup = () => {
              video.removeEventListener("canplaythrough", ok);
              video.removeEventListener("error", bad);
            };
            video.addEventListener("canplaythrough", ok, { once: true });
            video.addEventListener("error", bad, { once: true });
            video.load();
            if (video.readyState >= 3) {
              cleanup();
              resolve();
            }
          });
        }
        if (cancelled) return;
        video.muted = true;
        await video.play();
        setStatus("Detekcja aktywna");
      } catch {
        if (!cancelled) setStatus("Film gotowy. Kliknij ▶, aby rozpocząć.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fileUrl, fileName, modelState]);

  const progressPct =
    videoProgress && videoProgress.total > 0
      ? Math.min(100, Math.round((videoProgress.loaded / videoProgress.total) * 100))
      : null;

  const showPlayer = !!fileUrl && bootPhase === "ready";

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
            {showPlayer ? (
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
              <div className="fire-empty" style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
                {bootPhase === "model" && (
                  <>
                    <span>⏳</span>
                    <b>Ładowanie modelu…</b>
                    <small>Chwilę, proszę czekać</small>
                  </>
                )}
                {bootPhase === "video" && (
                  <>
                    <span>⬇</span>
                    <b>Pobieranie nagrania…</b>
                    {progressPct !== null ? (
                      <small>
                        {progressPct}% · {formatBytes(videoProgress!.loaded)}
                        {videoProgress!.total > 0 ? ` / ${formatBytes(videoProgress!.total)}` : ""}
                      </small>
                    ) : videoProgress ? (
                      <small>{formatBytes(videoProgress.loaded)}</small>
                    ) : (
                      <small>Start pobierania…</small>
                    )}
                    {progressPct !== null && (
                      <div
                        style={{
                          width: "min(200px, 60%)",
                          height: 4,
                          borderRadius: 2,
                          background: "rgba(255,255,255,0.15)",
                          overflow: "hidden",
                          marginTop: 4,
                        }}
                      >
                        <div
                          style={{
                            width: `${progressPct}%`,
                            height: "100%",
                            background: "#61d7ff",
                            transition: "width 0.15s linear",
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
                {bootPhase === "error" && (
                  <>
                    <span>⚠</span>
                    <b>Błąd ładowania</b>
                    <small>{status}</small>
                  </>
                )}
              </div>
            )}
          </div>

          {showPlayer && (
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

          {modelState === "error" && (
            <div className="fire-model-error">
              <p>{modelError}</p>
              <button className="btn" type="button" onClick={() => void bootDemo()}>
                Spróbuj ponownie
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
              disabled={bootPhase === "model" || bootPhase === "video"}
              onClick={() => {
                clearLoop();
                videoRef.current?.pause();
                setPlaying(false);
                void bootDemo();
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
