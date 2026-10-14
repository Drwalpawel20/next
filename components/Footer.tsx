import { SITE } from "@/lib/site";
import EmailLink from "./EmailLink";

export default function Footer({ page }: { page: "home" | "about" }) {
  const base = page === "home" ? "" : "/";
  return (
    <footer className="ft">
      <div className="wrap">
        <div className="f-grid">
          <div className="f-brand">
            <a className="logo" href={page === "home" ? "#top" : "/"} aria-label="Drwal – strona główna"><span className="logo-word">Drwal</span></a>
            <p>Student 4. roku inżynierii danych. Szukam stażu lub pierwszej pracy w danych, ML albo backendzie.</p>
          </div>
          <div className="f-col">
            <h4>Na stronie</h4>
            <a href={page === "home" ? "#top" : "/"}>Start</a>
            <a href="/about">O mnie</a>
            <a href={base + "#projekty"}>Projekty</a>
            <a href={base + "#demo"}>Demo</a>
            <a href={base + "#kontakt"}>Kontakt</a>
          </div>
          <div className="f-col">
            <h4>Znajdź mnie</h4>
            <EmailLink />
            <a href={SITE.github} target="_blank" rel="noopener">GitHub</a>
          </div>
          <div className="f-col f-status">
            <h4><i className="live" />Open to work</h4>
            <span>Hybrydowo: Kraków, Rzeszów, Tarnów i okolice</span>
            <span>Zdalnie: z każdego miejsca</span>
          </div>
        </div>
        <div className="f-bottom">
          <span>© <span suppressHydrationWarning>{new Date().getFullYear()}</span> Paweł Drwal</span>
          <a href="#top">Wróć na górę</a>
        </div>
      </div>
    </footer>
  );
}
