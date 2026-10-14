"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/site";
import Magnetic from "./Magnetic";

type St = { t: "idle" | "busy" | "ok" | "err"; m?: string; gm?: string; body?: string };

export default function ContactForm() {
  const ref = useRef<HTMLFormElement>(null);
  const [msg, setMsg] = useState("");
  const [st, setSt] = useState<St>({ t: "idle" });

  useEffect(() => {
    const h = (e: Event) => {
      const n = (e as CustomEvent<string>).detail;
      setMsg((m) => m || `Cześć Paweł, mam pytanie o projekt ${n}: `);
      setTimeout(() => ref.current?.querySelector("textarea")?.focus({ preventScroll: true }), 900);
    };
    addEventListener("ask-project", h);
    return () => removeEventListener("ask-project", h);
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (d._gotcha) return;
    if (!d.name.trim() || !/^\S+@\S+\.\S+$/.test(d.email) || !d.message.trim()) {
      setSt({ t: "err", m: "Uzupełnij imię, poprawny e-mail i treść wiadomości." });
      return;
    }
    setSt({ t: "busy" });
    const su = "Wiadomość z portfolio od " + d.name;
    const body = `${d.message}\n\n${d.name} (${d.email})`;
    try {
      const r = await fetch("https://formsubmit.co/ajax/" + SITE.email, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: d.name, email: d.email, message: d.message, _subject: su, _template: "table", _captcha: "false", _replyto: d.email }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || String(j.success) === "false") throw new Error(j.message || "błąd " + r.status);
      form.reset(); setMsg("");
      setSt({ t: "ok", m: "Dzięki, wiadomość doszła. Odpiszę, jak tylko będę mógł." });
    } catch (err: any) {
      setSt({ t: "err", m: "Nie udało się wysłać automatycznie (" + (err.message || "brak połączenia") + ").", gm: `https://mail.google.com/mail/?view=cm&fs=1&to=${SITE.email}&su=${encodeURIComponent(su)}&body=${encodeURIComponent(body)}`, body: SITE.email + "\n\n" + body });
    }
  }

  return (
    <form ref={ref} onSubmit={submit} noValidate className="form">
      <label>Imię i nazwisko<input name="name" required autoComplete="name" placeholder="Jan Kowalski" /></label>
      <label>Adres e-mail<input type="email" name="email" required autoComplete="email" placeholder="jan@example.com" /></label>
      <label>Wiadomość<textarea name="message" required value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Cześć Paweł, chciałbym porozmawiać o…" /></label>
      <input className="hp" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="form-row">
        <Magnetic><button className="btn primary" type="submit" disabled={st.t === "busy"}>{st.t === "busy" ? "Wysyłam…" : "Wyślij wiadomość"}</button></Magnetic>
        <div className={"status " + (st.t === "err" ? "err" : "")} role="status" aria-live="polite">
          {st.m}
          {st.gm && (
            <span className="alt">
              <a href={st.gm} target="_blank" rel="noopener">Wyślij przez Gmaila</a>
              <button type="button" onClick={() => navigator.clipboard.writeText(st.body || "")}>Skopiuj adres i treść</button>
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
