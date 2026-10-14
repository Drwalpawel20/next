"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useDismiss } from "@/lib/useDismiss";

const LANGS = [
  { c: "pl", n: "Polski", f: "🇵🇱" }, { c: "en", n: "English", f: "🇬🇧" }, { c: "de", n: "Deutsch", f: "🇩🇪" },
  { c: "fr", n: "Français", f: "🇫🇷" }, { c: "es", n: "Español", f: "🇪🇸" }, { c: "it", n: "Italiano", f: "🇮🇹" },
  { c: "uk", n: "Українська", f: "🇺🇦" },
];
const KEY = "pd_language_v2";

function target(): string {
  try { const s = localStorage.getItem(KEY); if (s && LANGS.some((l) => l.c === s)) return s; } catch {}
  const list = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const r of list) { const c = String(r).toLowerCase().split(/[-_]/)[0]; if (LANGS.some((l) => l.c === c)) return c; }
  return "en";
}

const cookieOn = () => /(?:^|;\s*)googtrans=\/pl\/(?!pl)/.test(document.cookie);

/* Tłumaczenie sterujemy ciasteczkiem Google (/pl/xx). Polski to oryginał, więc wybór polskiego
   tylko kasuje ciasteczko i przeładowuje stronę. Dzięki temu nic nie jest tłumaczone drugi raz. */
function setCookie(lang: string) {
  const host = location.hostname, past = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
  const val = lang === "pl" ? "" : `/pl/${lang}`;
  const base = val ? `googtrans=${val}; path=/` : `googtrans=; ${past}; path=/`;
  document.cookie = base;
  document.cookie = `${base}; domain=${host}`;
  document.cookie = `${base}; domain=.${host}`;
}

function loadWidget() {
  if (document.getElementById("gt-script")) return;
  (window as any).googleTranslateElementInit = () => {
    new (window as any).google.translate.TranslateElement({ pageLanguage: "pl", includedLanguages: "pl,en,de,fr,es,it,uk", autoDisplay: false }, "google_translate_element");
  };
  const s = document.createElement("script");
  s.id = "gt-script"; s.async = true;
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  document.body.appendChild(s);
}

export default function LangSwitch() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("pl");
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  useEffect(() => {
    const t = target();
    setLang(t);
    if (t === "pl") {
      // strona jest po polsku; jeśli został stary ślad tłumaczenia, usuń go i odśwież raz
      if (cookieOn() && !sessionStorage.getItem("pd_lang_fix")) {
        sessionStorage.setItem("pd_lang_fix", "1");
        setCookie("pl");
        location.reload();
      }
      return;
    }
    setCookie(t);
    loadWidget();
  }, []);

  const choose = (l: string) => {
    setOpen(false);
    if (l === lang) return;
    try { localStorage.setItem(KEY, l); sessionStorage.removeItem("pd_lang_fix"); } catch {}
    setCookie(l);
    location.reload();
  };

  return (
    <div className="pop-wrap" ref={ref} translate="no">
      <button className="round lang" aria-label="Wybierz język" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.4 2.4 3.5 5.4 3.5 9s-1.1 6.6-3.5 9c-2.4-2.4-3.5-6.6-3.5-9S9.6 5.4 12 3Z" /></svg>
        {lang.toUpperCase()}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="pop" role="menu" aria-label="Wybór języka" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.22 }}>
            <p className="pop-h" translate="yes">Język strony</p>
            {LANGS.map((l) => (
              <button key={l.c} role="menuitem" aria-pressed={lang === l.c} onClick={() => choose(l.c)}>
                <span className="flag">{l.f}</span>{l.n}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
