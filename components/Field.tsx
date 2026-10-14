"use client";
import { useEffect, useRef } from "react";

/* Pole punktów danych: linie łączą bliskie punkty, kursor je odpycha. Pauzuje poza ekranem. */
export default function Field() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999 };
    let w = 0, h = 0, raf = 0, visible = true;
    type P = { x: number; y: number; vx: number; vy: number };
    let pts: P[] = [];
    const readColor = () => getComputedStyle(document.documentElement).getPropertyValue("--ar").trim() || "91,134,255";
    let col = readColor();

    const size = () => {
      const r = c.getBoundingClientRect();
      w = r.width; h = r.height;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(95, Math.floor((w * h) / 13000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 }));
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 150 && d > 0) { p.x += (dx / d) * (150 - d) * 0.025; p.y += (dy / d) * (150 - d) * 0.025; }
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 135) {
            ctx.strokeStyle = `rgba(${col},${(1 - d / 135) * 0.3})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.fillStyle = `rgba(${col},.75)`;
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.7, 0, 6.283); ctx.fill();
      }
      if (!rm && visible) raf = requestAnimationFrame(frame);
    };

    const move = (e: PointerEvent) => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const leave = () => { mouse.x = mouse.y = -9999; };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !rm) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
    });
    const mo = new MutationObserver(() => { col = readColor(); if (rm) frame(); });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    size(); frame(); io.observe(c);
    addEventListener("resize", size);
    addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); mo.disconnect();
      removeEventListener("resize", size); removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);
  return <canvas ref={ref} className="field" aria-hidden="true" />;
}
