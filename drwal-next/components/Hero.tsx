"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Field from "./Field";
import Magnetic from "./Magnetic";
import Count from "./Count";

const WORDS = ["Dane,", "modele", "i", "aplikacje,", "które", "da", "się", "uruchomić."];
const d = (s: string) => ({ "--d": s }) as React.CSSProperties;

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const o = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  return (
    <section className="hero" id="top" ref={ref}>
      <Field />
      <motion.div className="wrap hero-in" style={{ y, opacity: o }}>
        <h1>
          {WORDS.map((w, i) => (
            <span key={i}>
              <span className="w"><span style={{ "--i": i } as React.CSSProperties}>{w}</span></span>{" "}
            </span>
          ))}
        </h1>
        <p className="lead rise" style={d(".85s")}>
          Jestem Paweł, czwarty rok inżynierii danych. Trenuję modele, składam hurtownie w PostgreSQL i pakuję to w coś, co da się kliknąć.
        </p>
        <p className="avail rise" style={d("1s")}>
          <i className="live" />
          Szukam stażu albo pierwszej pracy. Hybrydowo w Krakowie, Rzeszowie, Tarnowie i okolicach, albo zdalnie z dowolnego miejsca.
        </p>
        <div className="btns rise" style={d("1.15s")}>
          <Magnetic><a className="btn primary" href="#projekty">Zobacz projekty</a></Magnetic>
          <Magnetic><a className="btn" href="#kontakt">Napisz do mnie</a></Magnetic>
        </div>
        <dl className="facts rise" style={d("1.4s")}>
          <div><dt>projektów na GitHubie</dt><dd><Count to={12} /></dd></div>
          <div><dt>trafności w dwóch modelach ML</dt><dd><Count to={97} prefix="~" suffix="%" /></dd></div>
          <div><dt>zamówień w danych sklepu</dt><dd><Count to={500} suffix="k" /></dd></div>
          <div><dt>klas guzów w klasyfikatorze MRI</dt><dd><Count to={30} /></dd></div>
        </dl>
      </motion.div>
    </section>
  );
}
