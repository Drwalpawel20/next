"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const KEY = "pd_cookie_consent_v1";
type Consent = { analytics: boolean; marketing: boolean };

function pushConsent(c: Consent) {
  const g = (window as any).gtag;
  if (typeof g !== "function") return;
  g("consent", "update", {
    analytics_storage: c.analytics ? "granted" : "denied",
    ad_storage: c.marketing ? "granted" : "denied",
    ad_user_data: c.marketing ? "granted" : "denied",
    ad_personalization: c.marketing ? "granted" : "denied",
  });
}

export default function Cookie() {
  const [banner, setBanner] = useState(false);
  const [panel, setPanel] = useState(false);
  const [saved, setSaved] = useState(false);
  const [a, setA] = useState(false);
  const [m, setM] = useState(false);

  useEffect(() => {
    let c: any = null;
    try { c = JSON.parse(localStorage.getItem(KEY) || "null"); } catch {}
    if (c && c.version === "1.0") { setSaved(true); setA(!!c.analytics); setM(!!c.marketing); pushConsent(c); }
    else setBanner(true);
  }, []);

  useEffect(() => {
    if (!panel) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setPanel(false);
    addEventListener("keydown", k);
    return () => removeEventListener("keydown", k);
  }, [panel]);

  const save = (c: Consent) => {
    try { localStorage.setItem(KEY, JSON.stringify({ necessary: true, ...c, timestamp: new Date().toISOString(), version: "1.0" })); } catch {}
    pushConsent(c); setA(c.analytics); setM(c.marketing);
    setBanner(false); setPanel(false); setSaved(true);
  };

  return (
    <div className="ck">
      <AnimatePresence>
        {banner && (
          <motion.div className="ck-banner" role="dialog" aria-labelledby="ck-t" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
            <div>
              <p id="ck-t" className="ck-title">Cookies</p>
              <p className="ck-text">Używam plików cookies, żeby strona działała, a za Twoją zgodą także do prostych statystyk odwiedzin. Domyślnie nic opcjonalnego nie jest włączone.</p>
            </div>
            <div className="ck-actions">
              <button className="btn sm" onClick={() => setPanel(true)}>Ustawienia</button>
              <button className="btn sm" onClick={() => save({ analytics: false, marketing: false })}>Odrzuć opcjonalne</button>
              <button className="btn sm primary" onClick={() => save({ analytics: true, marketing: true })}>Akceptuję wszystkie</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panel && (
          <motion.div className="ck-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => e.target === e.currentTarget && setPanel(false)}>
            <motion.div className="ck-panel" role="dialog" aria-modal="true" aria-labelledby="ck-st" data-lenis-prevent initial={{ y: 24, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 24, scale: 0.97 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
              <div className="ck-head">
                <h3 id="ck-st">Ustawienia cookies</h3>
                <button className="x" aria-label="Zamknij" onClick={() => setPanel(false)}>×</button>
              </div>
              <div className="ck-cat">
                <div><b>Niezbędne</b><p>Działanie strony, bezpieczeństwo i zapamiętanie motywu oraz języka. Zawsze włączone.</p></div>
                <label className="sw-t"><input type="checkbox" checked disabled /><span /></label>
              </div>
              <div className="ck-cat">
                <div><b>Analityczne</b><p>Google Analytics. Pokazuje mi, które fragmenty strony ktoś faktycznie czyta.</p></div>
                <label className="sw-t"><input type="checkbox" checked={a} onChange={(e) => setA(e.target.checked)} aria-label="Analityczne" /><span /></label>
              </div>
              <div className="ck-cat">
                <div><b>Marketingowe</b><p>Sygnały reklamowe Google. Na stronie nie ma reklam, więc zwykle nic to nie zmienia.</p></div>
                <label className="sw-t"><input type="checkbox" checked={m} onChange={(e) => setM(e.target.checked)} aria-label="Marketingowe" /><span /></label>
              </div>
              <div className="ck-foot">
                <p>Decyzję zmienisz w każdej chwili przyciskiem cookies w rogu ekranu.</p>
                <button className="btn primary" onClick={() => save({ analytics: a, marketing: m })}>Zapisz ustawienia</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {saved && !banner && (
        <button className="ck-manage" aria-label="Zmień ustawienia prywatności" title="Ustawienia prywatności" onClick={() => setPanel(true)}>
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 3a9 9 0 1 0 9 9M12 3v4M21 12h-4" /><circle cx="8" cy="12" r="1" /><circle cx="12" cy="16" r="1" /><circle cx="15" cy="9" r="1" /></svg>
        </button>
      )}
    </div>
  );
}
