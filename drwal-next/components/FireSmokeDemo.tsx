
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InferenceSession } from "onnxruntime-web";

type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
  score: number;
  cls: number;
};

const SIZE = 640;
const IOU_THRESHOLD = 0.45;
const CLASSES = ["Smoke", "Fire"];

// Plik umieszczony w public/videos/
const DEMO_VIDEO = "/videos/yolo_demo_1.mp4";

function iou(a: Box, b: Box) {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);

  const intersection =
    Math.max(0, x2 - x1) * Math.max(0, y2 - y1);

  return (
    intersection /
    (a.w * a.h + b.w * b.h - intersection + 1e-6)
  );
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

    const cls = fire > smoke ? 1 : 0;
    const score = Math.max(smoke, fire);

    if (score < threshold) continue;

    const cx = data[i];
    const cy = data[count + i];
    const bw = data[2 * count + i];
    const bh = data[3 * count + i];

    const x = Math.max(
      0,
      Math.min(width, (cx - bw / 2 - padX) / scale)
    );

    const y = Math.max(
      0,
      Math.min(height, (cy - bh / 2 - padY) / scale)
    );

    const x2 = Math.max(
      0,
      Math.min(width, (cx + bw / 2 - padX) / scale)
    );

    const y2 = Math.max(
      0,
      Math.min(height, (cy + bh / 2 - padY) / scale)
    );

    if (x2 > x && y2 > y) {
      candidates.push({
        x,
        y,
        w: x2 - x,
        h: y2 - y,
        score,
        cls,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const kept: Box[] = [];

  for (const box of candidates) {
    if (
      kept.every(
        (other) =>
          other.cls !== box.cls ||
          iou(box, other) < IOU_THRESHOLD
      )
    ) {
      kept.push(box);
    }

    if (kept.length >= 80) break;
  }

  return kept;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${mins}:${secs}`;
}

export default function FireSmokeDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const sessionRef = useRef<InferenceSession | null>(null);

  const ortRef = useRef<
    | (typeof import("onnxruntime-web") |
        typeof import("onnxruntime-web/webgpu"))
    | null
  >(null);

  const sessionPromiseRef = useRef<Promise<void> | null>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const lastRunRef = useRef(0);

  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [aspect, setAspect] = useState(16 / 9);
  const [confidence, setConfidence] = useState(0.1);

  const confidenceRef = useRef(0.1);

  const [loading, setLoading] = useState(false);

  const [modelState, setModelState] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");

  const [modelError, setModelError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [status, setStatus] = useState(
    "Wybierz nagranie, aby rozpocząć"
  );

  const [stats, setStats] = useState({
    count: 0,
    top: 0,
    latency: 0,
  });

  const clearLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = null;
  }, []);

  const ensureSession = useCallback(() => {
    if (sessionRef.current && ortRef.current) {
      setModelState("ready");
      setStatus("Model gotowy. Możesz uruchomić analizę.");
      return Promise.resolve();
    }

    if (sessionPromiseRef.current) {
      return sessionPromiseRef.current;
    }

    setModelState("loading");
    setModelError("");

    setStatus(
      "Przygotowujemy model do analizy. Pierwsze ładowanie może potrwać chwilę."
    );

    const task = (async () => {
      const response = await fetch(
        "/models/fire-smoke-yolo26s.onnx",
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(
          `Model ONNX nie został pobrany (HTTP ${response.status}).`
        );
      }

      const modelBytes = new Uint8Array(
        await response.arrayBuffer()
      );

      if (modelBytes.byteLength < 1024 * 1024) {
        const preview = new TextDecoder().decode(
          modelBytes.subarray(0, 200)
        );

        if (preview.includes("git-lfs.github.com/spec")) {
          throw new Error(
            "Serwer zwrócił wskaźnik Git LFS zamiast modelu ONNX."
          );
        }

        throw new Error(
          `Pobrany model jest niepełny (${modelBytes.byteLength} B).`
        );
      }

      if (modelBytes[0] !== 0x08) {
        throw new Error(
          "Pobrany plik nie wygląda na model ONNX."
        );
      }

      if ("gpu" in navigator) {
        try {
          const ort = await import("onnxruntime-web/webgpu");

          ort.env.wasm.wasmPaths = "/ort/";
          ort.env.webgpu.powerPreference = "high-performance";

          sessionRef.current =
            await ort.InferenceSession.create(modelBytes, {
              executionProviders: ["webgpu", "wasm"],
            });

          ortRef.current = ort;
        } catch {
          setStatus(
            "Akceleracja GPU jest niedostępna. Przygotowujemy model do pracy na CPU."
          );
        }
      }

      if (!sessionRef.current) {
        const ort = await import("onnxruntime-web");

        ort.env.wasm.wasmPaths = "/ort/";
        ort.env.wasm.proxy = true;

        try {
          sessionRef.current =
            await ort.InferenceSession.create(modelBytes, {
              executionProviders: ["wasm"],
            });
        } catch {
          ort.env.wasm.proxy = false;

          sessionRef.current =
            await ort.InferenceSession.create(modelBytes, {
              executionProviders: ["wasm"],
            });
        }

        ortRef.current = ort;
      }

      if (!sessionRef.current || !ortRef.current) {
        throw new Error(
          "Nie udało się uruchomić silnika ONNX."
        );
      }
    })()
      .then(() => {
        setModelState("ready");
        setStatus("Model gotowy. Możesz uruchomić analizę.");
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error
            ? error.message
            : "Nie udało się przygotować modelu.";

        setModelState("error");
        setModelError(message);
        setStatus("Nie udało się przygotować modelu.");

        throw error;
      })
      .finally(() => {
        sessionPromiseRef.current = null;
      });

    sessionPromiseRef.current = task;

    return task;
  }, []);

  const chooseFile = useCallback(
    (file?: File) => {
      if (!file) return;

      if (!file.type.startsWith("video/")) {
        setStatus(
          "Wybierz plik wideo, np. MP4, WebM lub MOV."
        );
        return;
      }

      clearLoop();
      videoRef.current?.pause();

      if (fileUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fileUrl);
      }

      const url = URL.createObjectURL(file);

      setFileUrl(url);
      setFileName(file.name);
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setStats({ count: 0, top: 0, latency: 0 });

      void ensureSession().catch(() => {});
    },
    [clearLoop, ensureSession, fileUrl]
  );

  // Wczytuje film z public/videos bez tworzenia blob URL.
  const chooseDemo = useCallback(async () => {
    clearLoop();
    videoRef.current?.pause();

    if (fileUrl.startsWith("blob:")) {
      URL.revokeObjectURL(fileUrl);
    }

    setFileUrl("");
    setFileName("yolo_demo_1.mp4");
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setStats({ count: 0, top: 0, latency: 0 });
    setLoading(true);
    setStatus("Sprawdzanie przykładowego nagrania…");

    try {
      const response = await fetch(DEMO_VIDEO, {
        method: "HEAD",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          `Nie znaleziono przykładowego filmu (HTTP ${response.status}). Sprawdź ścieżkę ${DEMO_VIDEO}.`
        );
      }

      setFileUrl(DEMO_VIDEO);
      setStatus("Przykładowe nagranie zostało wczytane.");

      void ensureSession().catch(() => {});
    } catch (error) {
      setFileName("");
      setStatus(
        error instanceof Error
          ? error.message
          : "Nie udało się wczytać przykładowego filmu."
      );
    } finally {
      setLoading(false);
    }
  }, [clearLoop, ensureSession, fileUrl]);

  const detect = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (
      !video ||
      !canvas ||
      video.readyState < 2 ||
      busyRef.current
    ) {
      return;
    }

    busyRef.current = true;

    const started = performance.now();
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

      if (!ort) {
        throw new Error(
          "Nie udało się uruchomić silnika ONNX."
        );
      }

      if (!frameCanvasRef.current) {
        frameCanvasRef.current = document.createElement("canvas");
      }

      const frame = frameCanvasRef.current;

      frame.width = SIZE;
      frame.height = SIZE;

      const fctx = frame.getContext("2d", {
        willReadFrequently: true,
      });

      if (!fctx) {
        throw new Error(
          "Nie udało się przygotować klatki wideo."
        );
      }

      const scale = Math.min(SIZE / w, SIZE / h);

      const drawW = Math.round(w * scale);
      const drawH = Math.round(h * scale);

      const padX = (SIZE - drawW) / 2;
      const padY = (SIZE - drawH) / 2;

      fctx.fillStyle = "rgb(114, 114, 114)";
      fctx.fillRect(0, 0, SIZE, SIZE);

      fctx.drawImage(video, padX, padY, drawW, drawH);

      const rgba = fctx.getImageData(
        0,
        0,
        SIZE,
        SIZE
      ).data;

      const input = new Float32Array(
        3 * SIZE * SIZE
      );

      for (let i = 0; i < SIZE * SIZE; i++) {
        input[i] = rgba[i * 4] / 255;
        input[SIZE * SIZE + i] = rgba[i * 4 + 1] / 255;
        input[2 * SIZE * SIZE + i] = rgba[i * 4 + 2] / 255;
      }

      const tensor = new ort.Tensor(
        "float32",
        input,
        [1, 3, SIZE, SIZE]
      );

      const session = sessionRef.current;

      if (!session) {
        throw new Error("Sesja modelu nie jest gotowa.");
      }

      const result = await session.run({
        [session.inputNames[0]]: tensor,
      });

      const output = result[session.outputNames[0]];

      const boxes = decode(
        output.data as Float32Array,
        w,
        h,
        scale,
        padX,
        padY,
        confidenceRef.current
      );

      ctx.clearRect(0, 0, w, h);

      const ratio = Math.max(1, w / 960);

      ctx.lineWidth = 3 * ratio;
      ctx.font = `600 ${Math.round(16 * ratio)}px system-ui, sans-serif`;

      for (const box of boxes) {
        const color =
          box.cls === 1 ? "#ff634f" : "#61d7ff";

        const label = `${CLASSES[box.cls]} ${(box.score * 100).toFixed(0)}%`;

        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        ctx.strokeRect(
          box.x,
          box.y,
          box.w,
          box.h
        );

        const labelW =
          ctx.measureText(label).width + 16;

        const labelH = 27 * ratio;
        const labelY = Math.max(0, box.y - labelH);

        ctx.fillRect(
          box.x,
          labelY,
          labelW,
          labelH
        );

        ctx.fillStyle = "#08101b";

        ctx.fillText(
          label,
          box.x + 8 * ratio,
          labelY + 19 * ratio
        );
      }

      setStats({
        count: boxes.length,
        top: boxes[0]?.score ?? 0,
        latency: performance.now() - started,
      });

      setStatus(
        boxes.length
          ? "Detekcja aktywna"
          : "Analiza trwa · nie wykryto obiektów w tej klatce"
      );
    } catch (error) {
      clearLoop();
      video.pause();
      setPlaying(false);

      setStatus(
        error instanceof Error
          ? `Błąd modelu: ${error.message}`
          : "Nie udało się uruchomić modelu."
      );
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

      if (
        time - lastRunRef.current > 220 &&
        !busyRef.current
      ) {
        lastRunRef.current = time;
        void detect();
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [detect]
  );

  const start = async () => {
    const video = videoRef.current;

    if (
      !video ||
      !fileUrl ||
      modelState !== "ready" ||
      !sessionRef.current
    ) {
      return;
    }

    setLoading(true);
    setStatus("Przygotowanie modelu i nagrania…");

    try {
      await video.play();

      setPlaying(true);
      clearLoop();

      lastRunRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setStatus(
        "Nie udało się odtworzyć nagrania. Spróbuj ponownie."
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

  useEffect(() => {
    return () => {
      clearLoop();

      // Revoke tylko adresy utworzone przez URL.createObjectURL().
      if (fileUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [clearLoop, fileUrl]);

  return (
    <section
      className="fire-demo wrap"
      aria-labelledby="fire-title"
    >
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
          Wybierz własne nagranie lub uruchom przykładowy film.
          Model wykrywa ogień i dym bezpośrednio w przeglądarce,
          a wybrany plik pozostaje na Twoim urządzeniu.
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
            <input
              type="file"
              accept="video/*"
              onChange={(e) =>
                chooseFile(e.target.files?.[0])
              }
            />

            <span className="upload-icon">↥</span>

            <span>
              <b>
                {fileName || "Wybierz lub upuść nagranie"}
              </b>
              <small>
                MP4, WebM, MOV · plik przetwarzany lokalnie
              </small>
            </span>

            <span className="btn">Przeglądaj pliki</span>
          </label>

          <div className="fire-confidence">
            <label htmlFor="fire-confidence">
              Pewność detekcji{" "}
              <b>{Math.round(confidence * 100)}%</b>
            </label>

            <input
              id="fire-confidence"
              type="range"
              min="5"
              max="80"
              step="5"
              value={Math.round(confidence * 100)}
              onChange={(e) => {
                const value = Number(e.target.value) / 100;
                confidenceRef.current = value;
                setConfidence(value);
              }}
            />

            <small>Minimalna pewność wykrycia obiektu</small>
          </div>

          <div
            className="fire-stage"
            style={{ aspectRatio: aspect }}
          >
            {fileUrl ? (
              <>
                <video
                  ref={videoRef}
                  src={fileUrl}
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={(e) => {
                    const video = e.currentTarget;

                    setAspect(
                      video.videoWidth / video.videoHeight ||
                        16 / 9
                    );

                    setDuration(video.duration || 0);

                    // Wyzeruj canvas dla nowego nagrania.
                    const canvas = canvasRef.current;

                    if (canvas) {
                      const ctx = canvas.getContext("2d");
                      ctx?.clearRect(
                        0,
                        0,
                        canvas.width,
                        canvas.height
                      );
                    }
                  }}
                  onTimeUpdate={(e) =>
                    setCurrentTime(
                      e.currentTarget.currentTime
                    )
                  }
                  onSeeked={() => {
                    if (
                      !sessionRef.current ||
                      !videoRef.current?.paused
                    ) {
                      return;
                    }

                    void detect();
                  }}
                  onPlay={(e) => {
                    if (
                      modelState !== "ready" ||
                      !sessionRef.current
                    ) {
                      e.currentTarget.pause();
                      return;
                    }

                    setPlaying(true);
                    clearLoop();

                    lastRunRef.current = 0;
                    rafRef.current =
                      requestAnimationFrame(tick);
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
                  onError={() => {
                    setStatus(
                      "Nie udało się odtworzyć filmu. Sprawdź format pliku."
                    );
                  }}
                />

                <canvas
                  ref={canvasRef}
                  aria-label="Klatka wideo z zaznaczonymi detekcjami ognia i dymu"
                />
              </>
            ) : (
              <div className="fire-empty">
                <span>▶</span>
                <b>Podgląd nagrania</b>
                <small>
                  Wybierz plik lub załaduj przykładowe nagranie
                </small>
              </div>
            )}
          </div>

          {fileUrl && (
            <div
              className="fire-player"
              aria-label="Sterowanie nagraniem"
            >
              <button
                className="fire-player-toggle"
                type="button"
                onClick={playing ? stop : start}
                disabled={
                  loading ||
                  modelState !== "ready"
                }
                aria-label={
                  playing
                    ? "Wstrzymaj analizę"
                    : "Uruchom analizę"
                }
              >
                {playing ? "Ⅱ" : "▶"}
              </button>

              <span className="fire-player-time">
                {formatTime(currentTime)}
              </span>

              <input
                className="fire-seek"
                type="range"
                min="0"
                max={Math.max(duration, 0.01)}
                step="0.01"
                value={Math.min(
                  currentTime,
                  duration || 0
                )}
                aria-label="Pozycja nagrania"
                onChange={(e) => {
                  const time = Number(e.target.value);

                  if (videoRef.current) {
                    videoRef.current.currentTime = time;
                  }

                  setCurrentTime(time);
                }}
              />

              <span className="fire-player-time">
                {formatTime(duration)}
              </span>
            </div>
          )}

          <div className="fire-controls">
            <span className="fire-status">
              <i className={playing ? "live" : ""} />
              {loading
                ? "Uruchamianie modelu…"
                : status}
            </span>
          </div>

          {modelState === "loading" && (
            <p className="fire-model-note" role="status">
              Przygotowanie modelu może potrwać chwilę.
              Analizę będzie można uruchomić po zakończeniu.
            </p>
          )}

          {modelState === "error" && (
            <div className="fire-model-error">
              <p>{modelError}</p>

              <button
                className="btn"
                type="button"
                onClick={() => {
                  void ensureSession().catch(() => {});
                }}
              >
                Ponów przygotowanie modelu
              </button>
            </div>
          )}

          <div className="fire-examples">
            <div>
              <h2>Przykładowe nagranie</h2>
              <p>
                Uruchom demonstrację detekcji ognia i dymu
                na przygotowanym filmie.
              </p>
            </div>

            <button
              className="btn"
              type="button"
              onClick={() => void chooseDemo()}
              disabled={loading}
            >
              ▶ Uruchom przykład
            </button>
          </div>
        </div>

        <aside className="fire-side">
          <p className="fire-side-label">
            WYNIK NA ŻYWO
          </p>

          <div className="fire-metric">
            <span>Boxy na klatce wideo</span>
            <b>{stats.count}</b>
          </div>

          <div className="fire-metric">
            <span>Najwyższa pewność</span>
            <b>
              {stats.top
                ? `${(stats.top * 100).toFixed(1)}%`
                : "—"}
            </b>
          </div>

          <div className="fire-metric">
            <span>Czas inferencji</span>
            <b>
              {stats.latency
                ? `${stats.latency.toFixed(0)} ms`
                : "—"}
            </b>
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
            Demo edukacyjne. Wynik modelu nie zastępuje
            alarmu przeciwpożarowego ani oceny służb ratunkowych.
          </p>
        </aside>
      </div>
    </section>
  );
}
