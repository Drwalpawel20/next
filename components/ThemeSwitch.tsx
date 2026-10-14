"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDismiss } from "@/lib/useDismiss";

const THEMES = [
  { k: "blue", n: "Kobalt", c: "#5b86ff,#9a7bff" },
  { k: "violet", n: "Fiolet", c: "#b184ff,#e056fd" },
  { k: "forest", n: "Ciemna zieleń", c: "#2ed19a,#8be28b" },
  { k: "ocean", n: "Ocean", c: "#2fd4ee,#3b82f6" },
  { k: "ember", n: "Żar", c: "#ff8a3d,#ff4d6d" },
  { k: "gold", n: "Złoto", c: "#e8c36a,#f4a259" },
];

export default function ThemeSwitch() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState("blue");
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  useEffect(() => { setTheme(document.documentElement.dataset.theme || "blue"); }, []);

  const pick = (k: string) => {
    const go = () => {
      document.documentElement.dataset.theme = k;
      setTheme(k);
      try { localStorage.setItem("theme", k); } catch {}
    };
    const vt = (document as any).startViewTransition;
    if (vt && !matchMedia("(prefers-reduced-motion: reduce)").matches) vt.call(document, go); else go();
    setOpen(false);
  };

  return (
    <div className="pop-wrap" ref={ref}>
      <button className="round" aria-label="Zmień motyw kolorystyczny" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="sw" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="pop" role="menu" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.22 }}>
            <p className="pop-h">Motyw strony</p>
            {THEMES.map((t) => (
              <button key={t.k} role="menuitem" aria-pressed={theme === t.k} onClick={() => pick(t.k)}>
                <i style={{ background: `linear-gradient(135deg,${t.c})` }} />
                {t.n}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
