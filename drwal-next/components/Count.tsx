"use client";
import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";

/* Renderuje wartość docelową od razu (SEO, brak JS), a animuje dopiero gdy element wejdzie w widok. */
export default function Count({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const [v, setV] = useState(to);
  useEffect(() => {
    if (!seen || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = animate(0, to, { duration: 1.8, ease: [0.22, 1, 0.36, 1], onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [seen, to]);
  return <span ref={ref}>{prefix}{v}{suffix}</span>;
}
