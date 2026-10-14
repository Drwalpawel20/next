"use client";
import { useState } from "react";
import { SITE } from "@/lib/site";

const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${SITE.email}&su=${encodeURIComponent("Wiadomość z portfolio")}`;

/* Klik kopiuje adres i podpowiada, gdzie otworzyć pocztę. Działa też, gdy nie masz skonfigurowanego klienta mailowego. */
export default function EmailLink({ className, children }: { className?: string; children?: React.ReactNode }) {
  const [pop, setPop] = useState(false);
  return (
    <span className="em">
      <a
        href={`mailto:${SITE.email}`}
        className={className}
        onClick={async (e) => {
          e.preventDefault();
          try { await navigator.clipboard.writeText(SITE.email); } catch {}
          setPop(true);
          setTimeout(() => setPop(false), 6000);
        }}
      >
        {children ?? SITE.email}
      </a>
      {pop && (
        <span className="em-pop" role="status">
          Adres skopiowany.
          <a href={gmail} target="_blank" rel="noopener">Otwórz w Gmailu</a>
          <a href={`mailto:${SITE.email}`}>Aplikacja pocztowa</a>
        </span>
      )}
    </span>
  );
}
