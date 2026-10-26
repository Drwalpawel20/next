"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useInView, useScroll, useTransform } from "motion/react";
import { FILTERS, LANG_COLORS, PROJECTS, Project } from "@/lib/data";
import ProjectModal from "./ProjectModal";

const FEATURED = ["aplikacja_kliniczna", "ecommerce-powerbi-dashboard", "Equipment-Decommissioning"];
const idx = (n: string) => PROJECTS.findIndex((p) => p.name === n);

const counts = Object.entries(
  PROJECTS.reduce<Record<string, number>>((a, p) => ((a[p.lang] = (a[p.lang] || 0) + 1), a), {})
).sort((a, b) => b[1] - a[1]);

/* Duży panel w stylu strony produktowej: okno rośnie i prostuje się podczas scrolla, zrzuty zmieniają się same. */
function Featured({ p, onOpen }: { p: Project; onOpen: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.84, 1]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [16, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.45], [0.2, 1]);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const [k, setK] = useState(0);

  useEffect(() => {
    if (!inView || p.slides.length < 2) return;
    const t = setInterval(() => setK((x) => (x + 1) % p.slides.length), 3400);
    return () => clearInterval(t);
  }, [inView, p.slides.length]);

  return (
    <article className="feat-p" ref={ref}>
      <div className="feat-t">
        <div>
          <p className="feat-lang" translate="no"><i className="dot" style={{ background: LANG_COLORS[p.lang] }} />{p.lang}{p.private ? ", repozytorium prywatne" : ""}</p>
          <h3>{p.title || p.name}</h3>
        </div>
        <div className="feat-r">
          <p>{p.desc}</p>
          {p.metrics && <div className="feat-metrics">{p.metrics.map((m) => <div key={m.l}><b>{m.v}</b><span>{m.l}</span></div>)}</div>}
          <button className="btn" onClick={onOpen}>Zobacz szczegóły</button>
        </div>
      </div>
      <div className="frame-wrap">
        <motion.div className="frame" style={{ scale, rotateX, opacity }} onClick={onOpen}>
          <div className="frame-bar"><i /><i /><i /><span>{p.slides[k].cap}</span></div>
          <div className="frame-body">
            {p.slides.map((s, j) => (
              <img key={s.img} src={s.img} alt={s.cap} className={j === k ? "on" : ""} loading="lazy" decoding="async" width={1280} height={720} />
            ))}
            {p.slides.length > 1 && <div className="fd">{p.slides.map((_, j) => <i key={j} className={j === k ? "on" : ""} />)}</div>}
          </div>
        </motion.div>
      </div>
    </article>
  );
}

function tilt(e: React.PointerEvent<HTMLButtonElement>) {
  if (e.pointerType !== "mouse") return;
  const t = e.currentTarget, r = t.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  t.style.setProperty("--rx", `${(0.5 - y) * 7}deg`);
  t.style.setProperty("--ry", `${(x - 0.5) * 9}deg`);
  t.style.setProperty("--mx", `${x * 100}%`);
  t.style.setProperty("--my", `${y * 100}%`);
}
const untilt = (e: React.PointerEvent<HTMLButtonElement>) => {
  e.currentTarget.style.setProperty("--rx", "0deg");
  e.currentTarget.style.setProperty("--ry", "0deg");
};

export default function ProjectIndex() {
  const [f, setF] = useState("all");
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <>
      <div className="feat-wrap">
        {FEATURED.map((n) => <Featured key={n} p={PROJECTS[idx(n)]} onOpen={() => setOpen(idx(n))} />)}
      </div>

      <div className="all-h">
        <h3>Wszystkie projekty</h3>
        <div className="langbar" aria-label="Języki w projektach">
          <div className="bar">{counts.map(([l, n]) => <span key={l} title={l} style={{ width: `${(n / PROJECTS.length) * 100}%`, background: LANG_COLORS[l] || "#888" }} />)}</div>
          <div className="legend" translate="no">{counts.map(([l, n]) => <span key={l}><i className="dot" style={{ background: LANG_COLORS[l] || "#888" }} />{l} ({n})</span>)}</div>
        </div>
      </div>

      <div className="filters" role="group" aria-label="Filtruj projekty">
        {["all", ...FILTERS].map((x) => <button key={x} aria-pressed={f === x} onClick={() => setF(x)}>{x === "all" ? "Wszystkie" : x}</button>)}
      </div>

      <LayoutGroup>
        <ul className="pgrid">
          <AnimatePresence initial={false}>
            {PROJECTS.map((p, i) =>
              f !== "all" && p.lang !== f ? null : (
                <motion.li key={p.name} layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="pcard">
                  <button onClick={() => setOpen(i)} onPointerMove={tilt} onPointerLeave={untilt} aria-label={`Otwórz projekt ${p.title || p.name}`}>
                    <div className={"pc-cover" + (p.portrait ? " portrait" : "") + (p.fit ? " fit" : "")}>
                      {p.slides[0] ? p.portrait ? (
                        <>
                          <img className="bg" src={p.slides[0].img} alt="" loading="lazy" decoding="async" width={640} height={400} />
                          <img className="fg" src={p.slides[0].img} alt={p.slides[0].cap} loading="lazy" decoding="async" width={300} height={640} />
                        </>
                      ) : (
                        <img src={p.slides[0].img} alt="" loading="lazy" decoding="async" width={640} height={400} onError={(e) => { const fb = p.slides[0].fb; if (fb && e.currentTarget.src !== fb) e.currentTarget.src = fb; }} />
                      ) : (
                        <div className="pc-type" style={{ "--c": LANG_COLORS[p.lang] || "#888" } as React.CSSProperties}><span>{p.tags.slice(0, 3).join(" / ")}</span></div>
                      )}
                    </div>
                    <div className="pc-body">
                      <h4>{p.title || p.name}</h4>
                      <p>{p.desc}</p>
                      <span className="pc-meta" translate="no"><i className="dot" style={{ background: LANG_COLORS[p.lang] || "#888" }} />{p.lang}{p.private ? ", prywatny" : ""}</span>
                    </div>
                  </button>
                </motion.li>
              )
            )}
          </AnimatePresence>
        </ul>
      </LayoutGroup>

      <p className="note">Aplikacja do MRI leży w prywatnym repozytorium. Chętnie pokażę ją na rozmowie.</p>
      <AnimatePresence>{open !== null && <ProjectModal key={open} p={PROJECTS[open]} onClose={close} />}</AnimatePresence>
    </>
  );
}
