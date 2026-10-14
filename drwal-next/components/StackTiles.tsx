"use client";
import { motion } from "motion/react";
import { PROJECTS } from "@/lib/data";
import { SITE } from "@/lib/site";

type T = { n: string; g: string; c: string; key: string; big?: boolean };
const TILES: T[] = [
  { n: "Python", g: "Py", c: "Dane i ML", key: "python", big: true },
  { n: "PostgreSQL", g: "Pg", c: "Bazy danych", key: "postgresql" },
  { n: "SQL", g: "SQL", c: "Bazy danych", key: "sql" },
  { n: "Power BI", g: "BI", c: "Raporty", key: "power bi" },
  { n: "TensorFlow", g: "TF", c: "Uczenie maszynowe", key: "tensorflow" },
  { n: "PyTorch", g: "Pt", c: "Uczenie maszynowe", key: "pytorch" },
  { n: "scikit-learn", g: "sk", c: "Uczenie maszynowe", key: "scikit-learn" },
  { n: "OpenCV", g: "CV", c: "Obraz", key: "opencv" },
  { n: "Kotlin", g: "Kt", c: "Android", key: "kotlin" },
  { n: "Java", g: "Jv", c: "Backend", key: "java" },
  { n: "Spring", g: "Sp", c: "Backend", key: "spring" },
  { n: "Docker", g: "Dk", c: "Narzędzia", key: "docker" },
  { n: "Camunda", g: "Cm", c: "Automatyzacja", key: "camunda" },
  { n: "BPMN", g: "BP", c: "Automatyzacja", key: "bpmn" },
  { n: "MATLAB", g: "Mx", c: "Obliczenia", key: "matlab" },
  { n: "Git", g: "Git", c: "Narzędzia", key: "git" },
];

const count = (key: string) => PROJECTS.filter((p) => p.tags.some((t) => { const x = t.toLowerCase(); return x === key || x.startsWith(key + " "); })).length;
const proj = (n: number) => (n === 1 ? "w 1 projekcie" : `w ${n} projektach`);

function glow(e: React.PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

const reveal = (i: number) => ({
  initial: { opacity: 0, y: 46, scale: 0.9, filter: "blur(10px)" },
  whileInView: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  viewport: { once: true, margin: "0px 0px -8% 0px" },
  transition: { type: "spring" as const, stiffness: 90, damping: 16, delay: (i % 6) * 0.06 },
});

export default function StackTiles() {
  return (
    <div className="tiles" translate="no">
      {TILES.map((t, i) => {
        const n = count(t.key);
        return (
          <motion.div key={t.n} className={"tile" + (t.big ? " big" : "")} onPointerMove={glow} {...reveal(i)}>
            <div className="tile-in" style={{ "--fd": `${(i * 0.7) % 5}s` } as React.CSSProperties}>
              <span className="glyph">{t.g}</span>
              <div>
                <p className="tn">{t.n}</p>
                <p className="tc">{t.c}</p>
                {n > 0 && (
                  <>
                    <div className="tbar"><motion.i initial={{ scaleX: 0 }} whileInView={{ scaleX: n / PROJECTS.length }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }} /></div>
                    <p className="tcount">{proj(n)}</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
      <motion.a
        className="tile wide link" href={`${SITE.github}/ecommerce-data-platform`} target="_blank" rel="noopener" onPointerMove={glow} {...reveal(1)}
      >
        <div className="tile-in">
          <span className="glyph sm">Pg + BI</span>
          <div>
            <p className="tn">Power BI podpięty do PostgreSQL</p>
            <p className="tc">Raporty łączą się bezpośrednio z serwerem bazy i pracują na widokach SQL. Przykład: 4 dashboardy sklepu w repozytorium ecommerce-data-platform.</p>
          </div>
        </div>
      </motion.a>
    </div>
  );
}
