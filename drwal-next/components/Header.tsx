"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import ThemeSwitch from "./ThemeSwitch";
import LangSwitch from "./LangSwitch";
import { SITE } from "@/lib/site";

export default function Header({ page }: { page: "home" | "about" | "demo" }) {
  const base = page === "home" ? "" : "/";
  const { scrollYProgress } = useScroll();
  const sx = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  const [open, setOpen] = useState(false);
  const [act, setAct] = useState("");

  useEffect(() => {
    if (page !== "home") return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setAct(e.target.id)), { rootMargin: "-40% 0px -55% 0px" });
    document.querySelectorAll("main section[id]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [page]);

  const links = [
    { href: "/about", t: "O mnie", on: page === "about" },
    { href: base + "#projekty", t: "Projekty", on: act === "projekty" },
    { href: "/demos", t: "Demo", on: page === "demo" || act === "demo" },
    { href: base + "#perspektywa", t: "Poza kodem", on: act === "perspektywa" },
    { href: base + "#kontakt", t: "Kontakt", on: act === "kontakt" },
  ];

  return (
    <header className="hd">
      <div className="wrap">
        <nav className="nav" aria-label="Główna nawigacja">
          <a className="logo" href={page === "home" ? "#top" : "/"} aria-label="Drwal – strona główna"><span className="logo-word">Drwal</span></a>
          <ul className="links">
            {links.map((l) => (
              <li key={l.t}><a href={l.href} className={l.on ? "on" : ""} aria-current={l.on && page === "about" ? "page" : undefined}>{l.t}</a></li>
            ))}
          </ul>
          <div className="tools">
            <ThemeSwitch />
            <LangSwitch />
            <button className="round burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">{open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 8h16M4 16h16" />}</svg>
            </button>
          </div>
        </nav>
      </div>
      <AnimatePresence>
        {open && (
          <motion.ul className="mnav" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}>
            {links.map((l) => <li key={l.t}><a href={l.href} onClick={() => setOpen(false)}>{l.t}</a></li>)}
          </motion.ul>
        )}
      </AnimatePresence>
      <motion.div className="prog" style={{ scaleX: sx }} />
    </header>
  );
}

