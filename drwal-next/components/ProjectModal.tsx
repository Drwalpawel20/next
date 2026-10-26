"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Project, LANG_COLORS } from "@/lib/data";
import { SITE } from "@/lib/site";

export default function ProjectModal({ p, onClose }: { p: Project; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  const repo = p.repo || p.name;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      const t = track.current;
      if (!t) return;
      if (e.key === "ArrowRight") t.scrollBy({ left: t.clientWidth, behavior: "smooth" });
      if (e.key === "ArrowLeft") t.scrollBy({ left: -t.clientWidth, behavior: "smooth" });
    };
    addEventListener("keydown", key);
    document.documentElement.style.overflow = "hidden";
    return () => { removeEventListener("keydown", key); document.documentElement.style.overflow = ""; prev?.focus(); };
  }, [onClose]);

  const scrollBy = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth, behavior: "smooth" });

  return (
    <motion.div className="md-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div
        ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={p.title || p.name} className="md" data-lenis-prevent
        initial={{ opacity: 0, y: 48, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 32, scale: 0.98 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="x" aria-label="Zamknij" onClick={onClose}>×</button>
        {p.slides.length > 0 ? (
          <div className="gal">
            <div className="track" ref={track} onScroll={(e) => setK(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
              {p.slides.map((s) => (
                <figure className="slide" key={s.img}>
                  <img
                    src={s.img} alt={s.cap} loading="lazy" decoding="async" width={1280} height={720}
                    onError={(e) => { if (s.fb && e.currentTarget.src !== s.fb) e.currentTarget.src = s.fb; }}
                  />
                  <figcaption>{s.cap}</figcaption>
                </figure>
              ))}
            </div>
            {p.slides.length > 1 && (
              <>
                <button className="arr prev" aria-label="Poprzednie zdjęcie" onClick={() => scrollBy(-1)}>‹</button>
                <button className="arr next" aria-label="Następne zdjęcie" onClick={() => scrollBy(1)}>›</button>
                <div className="dots">{p.slides.map((_, i) => <i key={i} className={i === k ? "on" : ""} />)}</div>
              </>
            )}
          </div>
        ) : (
          <div className="nogal"><span>{p.title || p.name}</span></div>
        )}
        <div className="mbody">
          <h3>{p.title || p.name}</h3>
          <p className="mlang" translate="no"><i className="dot" style={{ background: LANG_COLORS[p.lang] || "#888" }} />{p.lang}</p>
          <p className="mlong">{p.long}</p>
          <ul>{p.points.map((x) => <li key={x}>{x}</li>)}</ul>
          {p.metrics && <div className="metrics">{p.metrics.map((m) => <div key={m.l}><b>{m.v}</b><span>{m.l}</span></div>)}</div>}
          <div className="tags" translate="no">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
          <div className="btns">
            {p.private ? (
              <>
                {p.demo && <a className="btn primary" href={p.demo} {...(p.demo.startsWith("/") ? {} : { target: "_blank", rel: "noopener" })}>Przetestuj demo</a>}
                <a
                  className="btn" href="#kontakt"
                  onClick={() => { document.documentElement.style.overflow = ""; onClose(); dispatchEvent(new CustomEvent("ask-project", { detail: p.title || p.name })); }}
                >Zapytaj o projekt</a>
                <span className="btn ghost">Repozytorium prywatne</span>
              </>
            ) : (
              <>
                <a className="btn primary" href={`${SITE.github}/${repo}`} target="_blank" rel="noopener">Zobacz na GitHubie</a>
                <a className="btn" href={`${SITE.github}/${repo}#readme`} target="_blank" rel="noopener">README</a>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
