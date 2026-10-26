import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Statement from "@/components/Statement";
import AboutChart from "@/components/AboutChart";
import StackTiles from "@/components/StackTiles";
import EmailLink from "@/components/EmailLink";
import Magnetic from "@/components/Magnetic";
import JsonLd from "@/components/JsonLd";
import { SITE } from "@/lib/site";

const title = "O mnie – Paweł Drwal | Student informatyki, ML i dane";
const description = "Paweł Drwal – student informatyki. Interesuję się uczeniem maszynowym, analizą danych, aplikacjami mobilnymi i automatyzacją procesów. Szukam stażu lub pierwszej pracy.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["Paweł Drwal", "o mnie", "student informatyki", "machine learning", "Python", "staż IT", "junior developer"],
  alternates: { canonical: SITE.aboutUrl },
  openGraph: { type: "profile", url: SITE.aboutUrl, title: "O mnie – Paweł Drwal", description: "Student informatyki. ML, dane, Android, automatyzacja. Open to work." },
  twitter: { card: "summary", title: "O mnie – Paweł Drwal", description: "Student informatyki, ML, dane, open to work" },
};

const POINTS = [
  ["Analiza danych", "Przeglądam dane, szukam trendów i sprawdzam, czy to, co widać, ma sens."],
  ["Uczenie maszynowe", "Trenuję modele, mierzę, jak się sprawdzają, i poprawiam, aż zaczną działać."],
  ["Szukanie zależności", "Lubię wyłapywać, co się z czym łączy i co zmienia się w czasie."],
  ["Budowanie aplikacji", "Z gotowego modelu robię coś, co da się kliknąć: okienko, API albo apkę."],
];

const icon = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export default function About() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org", "@type": "AboutPage", name: "O mnie – Paweł Drwal", url: SITE.aboutUrl, inLanguage: "pl-PL",
          mainEntity: { "@type": "Person", name: SITE.name, email: "mailto:" + SITE.email, url: SITE.url + "/", sameAs: [SITE.github], jobTitle: "Student informatyki" },
        }}
      />
      <Header page="about" />
      <main className="about">
        <div className="wrap">
          <h1 className="about-h">Cześć, jestem Paweł.</h1>
          <p className="lead rise" style={{ "--d": ".5s" } as React.CSSProperties}>
            Jestem na czwartym roku <strong>inżynierii danych</strong>. Lubię grzebać w danych, uczyć modele i robić z nich aplikacje, które da się uruchomić.
          </p>
          <div className="btns rise" style={{ "--d": ".7s" } as React.CSSProperties}>
            <Magnetic><a className="btn primary" href="/#projekty">Zobacz projekty</a></Magnetic>
            <Magnetic><a className="btn" href="/#lab">Sieć neuronowa na żywo</a></Magnetic>
          </div>

          <AboutChart />

          <div className="about-points">
            {POINTS.map(([h, t]) => (
              <div key={h}><h3>{h}</h3><p>{t}</p></div>
            ))}
          </div>

          <Statement text="Najlepszy jest moment, w którym w stercie liczb nagle widać, o co w tym wszystkim chodzi." />

          <div className="arow">
            <h2>Kim jestem</h2>
            <p className="prose">Lubię przejść cały proces samodzielnie: zrozumieć problem, ogarnąć dane, zbudować model i na końcu zapakować to w coś, co da się odpalić. Najwięcej uczę się wtedy, kiedy coś nie działa i muszę dojść dlaczego.</p>
          </div>

          <div className="arow">
            <h2>Co robię</h2>
            <ul className="prose list">
              <li>Modele klasyfikacji, na przykład dla zdjęć MRI mózgu i ryzyka chorób serca, razem z pokazaniem, jak model doszedł do wyniku (Grad-CAM).</li>
              <li>Przetwarzanie i analizę danych w PostgreSQL, Pythonie i Power BI.</li>
              <li>Aplikację na Androida w Kotlinie do pilnowania domowego budżetu.</li>
              <li>Automatyzację procesów w BPMN (Camunda 8 i Spring Boot).</li>
            </ul>
          </div>

          <div className="arow">
            <h2>Stack</h2>
            <p className="prose">Pasek na kafelku pokazuje, w ilu z moich projektów dana technologia się pojawia.</p>
          </div>
          <StackTiles />

          <div className="arow" style={{ marginTop: 64 }}>
            <h2>Ścieżka</h2>
            <dl className="timeline">
              <div>
                <dt>Teraz</dt>
                <dd><strong>Open to work.</strong> Szukam stażu albo pierwszej pracy przy danych, ML, backendzie lub aplikacjach mobilnych. Mogę pracować hybrydowo w Krakowie, Rzeszowie, Tarnowie i okolicach albo zdalnie, z dowolnego miejsca.</dd>
              </div>
              <div>
                <dt>Projekty</dt>
                <dd>Projekty własne i zaliczeniowe są na <a className="ulink" href={SITE.github} target="_blank" rel="noopener">GitHubie</a>, od ML po Androida i BPMN.</dd>
              </div>
              <div>
                <dt>Studia</dt>
                <dd><strong>Inżynieria danych, 4. rok.</strong> Dużo danych, programowania i trochę automatyzacji.</dd>
              </div>
            </dl>
          </div>

          <div className="arow">
            <h2>Poza technologią</h2>
            <div>
              <p className="prose">Poza kodem gram w szachy i siatkówkę oraz jeżdżę na rowerze. Szachy uczą mnie myśleć do przodu, siatkówka to dobra drużyna i energia, a na rowerze odpoczywam od ekranu.</p>
              <ul className="hobbies hobbies-row">
                <li>
                  <svg viewBox="0 0 24 24" {...icon}><circle cx="12" cy="6.5" r="2.8" /><path d="M9.5 10.8h5M10.2 10.8c.1 2.4-.6 3.9-2.2 5.4M13.8 10.8c-.1 2.4.6 3.9 2.2 5.4M7 16.2h10M6 20h12l-1-3.8H7z" /></svg>
                  <b>Szachy</b><span>myślenie do przodu</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" {...icon}><circle cx="12" cy="12" r="10" /><path d="M11.1 7.1a16.55 16.55 0 0 1 10.9 4M12 12a12.6 12.6 0 0 1-8.7 5M16.8 13.6a16.55 16.55 0 0 1-9 7.5M20.7 17a12.8 12.8 0 0 0-8.7-5 13.3 13.3 0 0 1 0-10M6.3 3.8a16.55 16.55 0 0 0 1.9 11.5" /></svg>
                  <b>Siatkówka</b><span>gra zespołowa</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" {...icon}><circle cx="18.5" cy="17.5" r="3.5" /><circle cx="5.5" cy="17.5" r="3.5" /><circle cx="15" cy="5" r="1" /><path d="M12 17.5V14l-3-3 4-3 2 3h2" /></svg>
                  <b>Kolarstwo</b><span>reset głowy</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="arow">
            <h2>Kontakt</h2>
            <div className="prose">
              <p>Email: <EmailLink className="ulink" /><br />GitHub: <a className="ulink" href={SITE.github} target="_blank" rel="noopener">github.com/Drwalpawel20</a></p>
              <div className="btns" style={{ marginTop: 20 }}>
                <Magnetic><a className="btn primary" href="/#kontakt">Napisz do mnie</a></Magnetic>
                <Magnetic><a className="btn" href="/#projekty">Zobacz projekty</a></Magnetic>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer page="about" />
    </>
  );
}
