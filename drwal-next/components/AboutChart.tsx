"use client";
import { motion } from "motion/react";

const LINE = "M30 190L110 160L170 170L240 110L310 125L380 70L450 85L520 40L575 30";
const BARS = [50, 80, 64, 110, 92, 140, 120, 160, 150, 190, 170, 200];
const ease = [0.22, 1, 0.36, 1] as const;

export default function AboutChart() {
  return (
    <div className="viz-box">
      <svg className="viz" viewBox="0 0 600 240" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--accent)", stopOpacity: 0.3 }} />
            <stop offset="1" style={{ stopColor: "var(--accent)", stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        <g stroke="rgba(255,255,255,.07)"><path d="M0 60h600M0 120h600M0 180h600" vectorEffect="non-scaling-stroke" /></g>
        {BARS.map((h, i) => (
          <motion.rect
            key={i} x={30 + i * 46} y={240 - h} width={26} height={h} rx={4} fill="var(--accent)" opacity={0.12}
            style={{ transformBox: "fill-box", originY: 1 }}
            initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.05, ease }}
          />
        ))}
        <motion.path d={LINE + "V240H30Z"} fill="url(#vg)" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.3, duration: 1.2 }} />
        <motion.path d={LINE} fill="none" stroke="var(--accent)" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2.3, delay: 0.2, ease }} />
        <motion.path d="M575 30h.01" stroke="var(--accent2)" strokeWidth={16} strokeLinecap="round" vectorEffect="non-scaling-stroke"
          initial={{ opacity: 0 }} whileInView={{ opacity: [0, 1, 0.5, 1] }} viewport={{ once: true }} transition={{ delay: 2.4, duration: 1.4 }} />
      </svg>
      {["Trendy", "Sezonowość", "Asocjacje", "Klasyfikacja", "Anomalie"].map((t, i) => <span key={t} className={`viz-chip c${i + 1}`}><i />{t}</span>)}
      <div className="viz-copy">
        <strong>Zaczynam od danych.</strong>
        <span>Najpierw patrzę, co w nich siedzi, dopiero potem decyduję, co z tym zrobić.</span>
      </div>
    </div>
  );
}
