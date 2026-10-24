    if (!video || video.paused || video.ended) { rafRef.current = null; return; }
    if (time - lastRunRef.current > 220 && !busyRef.current) {
      lastRunRef.current = time;
      void detect();
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [detect]);

  const start = async () => {
    const video = videoRef.current;
    if (!video || !fileUrl || modelState !== "ready" || !sessionRef.current) return;
    setLoading(true);
    setStatus("Przygotowanie modelu i nagrania…");
    try {
      await video.play();
      setPlaying(true);
      clearLoop();
      lastRunRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    } catch (error) {
      console.error("Błąd video.play():", error);
      setStatus(
        error instanceof Error
          ? `Nie udało się odtworzyć nagrania: ${error.name} — ${error.message}`
          : "Nie udało się odtworzyć nagrania."
      );
    } finally { setLoading(false); }
  };

  const stop = () => {
    clearLoop();
    videoRef.current?.pause();
    setPlaying(false);
    setStatus("Analiza wstrzymana");
  };

  useEffect(() => () => {
    clearLoop();
    if (fileUrl.startsWith("blob:")) URL.revokeObjectURL(fileUrl);
  }, [clearLoop, fileUrl]);

  return (
    <section className="fire-demo wrap" aria-labelledby="fire-title">
      <a className="demo-back" href="/demos">← Wszystkie dema</a>
      <div className="fire-intro">
        <p className="demo-kicker"><i className="live" /> YOLO26S · DETEKCJA WIDEO</p>
        <h1 id="fire-title">Ogień i dym<span className="accent">.</span></h1>
        <p>Wybierz własne nagranie. Model wykrywa ogień i dym bezpośrednio w przeglądarce, a plik pozostaje na Twoim urządzeniu.</p>
      </div>
      <div className="fire-layout">
        <div className="fire-main">
          <label className="fire-upload" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); chooseFile(e.dataTransfer.files[0]); }}>
            <input type="file" accept="video/*" onChange={(e) => chooseFile(e.target.files?.[0])} />
            <span className="upload-icon">↥</span><span><b>{fileName || "Wybierz lub upuść nagranie"}</b><small>MP4, WebM, MOV · plik przetwarzany lokalnie</small></span>
            <span className="btn">Przeglądaj pliki</span>
          </label>
          <div className="fire-confidence"><label htmlFor="fire-confidence">Pewność detekcji <b>{Math.round(confidence * 100)}%</b></label><input id="fire-confidence" type="range" min="5" max="80" step="5" value={Math.round(confidence * 100)} onChange={(e) => { const value = Number(e.target.value) / 100; confidenceRef.current = value; setConfidence(value); }} /><small>Minimalna pewność wykrycia obiektu</small></div>
          <div className="fire-stage" style={{ aspectRatio: aspect }}>
            {fileUrl ? <>
              <video key={fileUrl} ref={videoRef} src={fileUrl} playsInline preload="metadata" onLoadedMetadata={(e) => { setAspect(e.currentTarget.videoWidth / e.currentTarget.videoHeight || 16 / 9); setDuration(e.currentTarget.duration || 0); setStatus("Nagranie gotowe. Możesz uruchomić analizę."); }} onError={(e) => {
                const video = e.currentTarget;
                const mediaError = video.error;
                console.error("Błąd wideo:", {
                  src: video.currentSrc,
                  code: mediaError?.code,
                  message: mediaError?.message,
                  networkState: video.networkState,
                  readyState: video.readyState,
                });
                setStatus(`Nie udało się wczytać filmu: ${mediaError?.message || `kod błędu ${mediaError?.code ?? "nieznany"}`}`);
              }} onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)} onSeeked={() => { if (!sessionRef.current || !videoRef.current?.paused) return; void detect(); }} onPlay={(e) => { if (modelState !== "ready" || !sessionRef.current) { e.currentTarget.pause(); return; } setPlaying(true); clearLoop(); lastRunRef.current = 0; rafRef.current = requestAnimationFrame(tick); }} onEnded={() => { clearLoop(); setPlaying(false); setStatus("Analiza zakończona"); }} onPause={() => { clearLoop(); setPlaying(false); }} />
              <canvas ref={canvasRef} aria-label="Klatka wideo z zaznaczonymi detekcjami ognia i dymu" />
            </> : <div className="fire-empty"><span>▶</span><b>Podgląd nagrania</b><small>Wybierz plik wideo, aby zobaczyć detekcje</small></div>}
          </div>
          {fileUrl && <div className="fire-player" aria-label="Sterowanie nagraniem">
            <button className="fire-player-toggle" type="button" onClick={playing ? stop : start} disabled={loading || modelState !== "ready"} aria-label={playing ? "Wstrzymaj analizę" : "Uruchom analizę"}>{playing ? "Ⅱ" : "▶"}</button>
            <span className="fire-player-time">{formatTime(currentTime)}</span>
            <input className="fire-seek" type="range" min="0" max={Math.max(duration, 0.01)} step="0.01" value={Math.min(currentTime, duration || 0)} aria-label="Pozycja nagrania" onChange={(e) => { const time = Number(e.target.value); if (videoRef.current) videoRef.current.currentTime = time; setCurrentTime(time); }} />
            <span className="fire-player-time">{formatTime(duration)}</span>
          </div>}
          <div className="fire-controls">
            <span className="fire-status"><i className={playing ? "live" : ""} />{loading ? "Uruchamianie modelu…" : status}</span>
          </div>
          {modelState === "loading" && <p className="fire-model-note" role="status">Przygotowanie modelu może potrwać chwilę. Analizę będzie można uruchomić po zakończeniu.</p>}
          {modelState === "error" && <div className="fire-model-error"><p>{modelError}</p><button className="btn" type="button" onClick={() => { void ensureSession().catch(() => {}); }}>Ponów przygotowanie modelu</button></div>}
          
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

      if (fileUrl.startsWith("blob:")) URL.revokeObjectURL(fileUrl);

      setFileUrl(DEMO_VIDEO);
      setFileName("demo_yolo_vid_1.mp4");
      setPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setStats({ count: 0, top: 0, latency: 0 });
      setStatus("Ładowanie przykładowego nagrania…");

      void ensureSession().catch(() => {});
    }}
  >
    ▶ Uruchom przykład
  </button>
</div>

        </div>
        <aside className="fire-side">
          <p className="fire-side-label">WYNIK NA ŻYWO</p>
          <div className="fire-metric"><span>Boxy na klatce wideo</span><b>{stats.count}</b></div>
          <div className="fire-metric"><span>Najwyższa pewność</span><b>{stats.top ? `${(stats.top * 100).toFixed(1)}%` : "—"}</b></div>
          <div className="fire-metric"><span>Czas inferencji</span><b>{stats.latency ? `${stats.latency.toFixed(0)} ms` : "—"}</b></div>
          <div className="fire-legend"><span><i className="fire-dot" /> Ogień</span><span><i className="smoke-dot" /> Dym</span></div>
          <p className="fire-disclaimer">Demo edukacyjne. Wynik modelu nie zastępuje alarmu przeciwpożarowego ani oceny służb ratunkowych.</p>
        </aside>
      </div>
    </section>
  );
}
