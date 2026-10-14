"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "motion/react";

function Word({ w, i, n, p }: { w: string; i: number; n: number; p: MotionValue<number> }) {
  const o = useTransform(p, [i / n, (i + 1) / n], [0.16, 1]);
  return <motion.span style={{ opacity: o }}>{w} </motion.span>;
}

/* Słowa zapalają się wraz ze scrollem. */
export default function Statement({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className="statement">
      {words.map((w, i) => <Word key={i} w={w} i={i} n={words.length} p={scrollYProgress} />)}
    </p>
  );
}
