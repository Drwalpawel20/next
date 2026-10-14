"use client";
import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroll() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({ lerp: 0.1 });
    let id = requestAnimationFrame(function raf(t) {
      l.raf(t);
      id = requestAnimationFrame(raf);
    });
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute("href")!.slice(1);
      const el = hash ? document.getElementById(hash) : null;
      if (!el) return;
      e.preventDefault();
      l.scrollTo(el, { offset: hash === "top" ? 0 : -60 });
      history.replaceState(null, "", "#" + hash);
    };
    document.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("click", onClick);
      l.destroy();
    };
  }, []);
  return null;
}
