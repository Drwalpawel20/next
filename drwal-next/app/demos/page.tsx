import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { PROJECTS } from "@/lib/data";
import { SITE } from "@/lib/site";

const title = "Demo modeli ML w przeglądarce | Paweł Drwal";
const description = "Dwa działające demo: klasyfikacja zdjęć MRI mózgu i wykrywanie ognia oraz dymu na wideo modelem YOLO. Wszystko liczy się w Twojej przeglądarce, bez wysyłania plików.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/demos" },
  openGraph: { type: "website", title, description, url: "/demos" },
  twitter: { card: "summary", title, description },
};

const mri = PROJECTS.find((p) => p.name === "aplikacja_kliniczna")!.slides[0];
const fire = PROJECTS.find((p) => p.name === "fire-smoke-yolo")!.slides[0];

const tiles = [
  {
    href: "https://drwalpawel20.github.io/brain-tumor-demo/",
    external: true,
    kind: "Klasyfikacja obrazu",
    title: "Guz mózgu na zdjęciu MRI",
    body: "Wgrywasz zdjęcie rezonansu, a model wskazuje trzy najbardziej prawdopodobne rozpoznania. Mapa uwagi pokazuje, które fragmenty obrazu najmocniej wpłynęły na wynik.",
    meta: [["Wejście", "Zdjęcie MRI"], ["Wynik", "Top 3 i mapa uwagi"], ["Silnik", "TensorFlow.js"]],
    note: "Projekt edukacyjny, nie narzędzie do diagnozy.",
    badge: "30 klas",
    image: { src: mri.img, alt: "Zrzut ekranu klasyfikatora MRI z wynikiem i mapą uwagi" },
  },
  {
    href: "/demos/fire-smoke",
    external: false,
    kind: "Detekcja obiektów na wideo",
    title: "Ogień i dym",
    body: "Wybierasz przykład albo własne nagranie, a model YOLO zaznacza ramką ogień i dym na kolejnych klatkach. Próg pewności ustawisz suwakiem.",
    meta: [["Wejście", "Nagranie wideo"], ["Wynik", "Ramki z pewnością"], ["Model", "ok. 38 MB"]],
    note: "Demo edukacyjne, nie system alarmowy.",
    badge: "YOLO26s",
    image: { src: fire.img, alt: "Klatka z nagrania z ramkami wokół ognia i dymu" },
  },
] as const;

const steps = [
  ["Wybierasz dane", "Własne zdjęcie albo nagranie z dysku, a w demo wideo także gotowy przykład. Plik zostaje na Twoim urządzeniu."],
  ["Model liczy lokalnie", "Sieć neuronowa działa w przeglądarce. Jeśli ją obsługuje, korzysta z karty graficznej (WebGPU), a jeśli nie, z procesora."],
  ["Widzisz wynik od razu", "Rozpoznania i ramki pojawiają się na obrazie. W demo wideo wynik odświeża się w trakcie odtwarzania."],
];

const spec = [
  ["Detekcja na wideo", "YOLO26s, wejście 640 × 640 px, dwie klasy: ogień i dym, eksport do formatu ONNX"],
  ["Silnik wideo", "ONNX Runtime Web, WebGPU z awaryjnym przejściem na WebAssembly"],
  ["Klasyfikacja MRI", "TensorFlow.js, 30 klas, mapa uwagi metodą okluzji"],
  ["Hosting", "Statyczna strona w Next.js, bez serwera, który analizowałby Twoje pliki"],
];

export default function DemosPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Demo modeli ML w przeglądarce",
          url: SITE.url + "/demos",
          inLanguage: "pl-PL",
          author: { "@type": "Person", name: SITE.name, url: SITE.url + "/" },
          hasPart: [
            { "@type": "WebApplication", name: "Klasyfikator zdjęć MRI mózgu", url: tiles[0].href, applicationCategory: "EducationalApplication", operatingSystem: "Przeglądarka" },
            { "@type": "WebApplication", name: "Wykrywanie ognia i dymu na wideo", url: SITE.url + tiles[1].href, applicationCategory: "EducationalApplication", operatingSystem: "Przeglądarka" },
          ],
        }}
      />
      <Header page="demo" />
      <main className="demo-page">
        <section className="demo-hub wrap" aria-labelledby="demo-title">
          <p className="demo-kicker"><i className="live" /> DEMO W PRZEGLĄDARCE</p>
          <h1 id="demo-title">Wybierz demo<span className="accent">.</span></h1>
          <p className="demo-lead">Dwa modele, które sam wytrenowałem, do wypróbowania bez instalacji. Otwórz wybrane demo i sprawdź je na własnych danych.</p>
          <div className="demo-grid">
            {tiles.map((tile) => {
              const content = (
                <>
                  <div className="demo-cover">
                    <img src={tile.image.src} alt={tile.image.alt} width={1280} height={720} loading="eager" decoding="async" />
                    <span className="demo-badge" translate="no">{tile.badge}</span>
                  </div>
                  <div className="demo-tile-body">
                    <p className="demo-tile-kind">{tile.kind}</p>
                    <h2>{tile.title}<span aria-hidden="true">{tile.external ? "↗" : "→"}</span></h2>
                    <p className="demo-tile-copy">{tile.body}</p>
                    <dl className="demo-meta">
                      {tile.meta.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
                    </dl>
                    <p className="demo-note-line">{tile.note}</p>
                    <span className="demo-open">Uruchom demo{tile.external ? " (nowa karta)" : ""} <b>→</b></span>
                  </div>
                </>
              );
              return tile.external ? (
                <a className="demo-tile" href={tile.href} target="_blank" rel="noopener noreferrer" key={tile.title}>{content}</a>
              ) : (
                <Link className="demo-tile" href={tile.href} key={tile.title}>{content}</Link>
              );
            })}
          </div>
        </section>

        <section className="demo-section wrap" aria-labelledby="how-title">
          <h2 id="how-title">Jak to działa</h2>
          <p className="demo-sub">Bez konta, bez instalacji i bez wysyłania plików na serwer.</p>
          <ol className="how">
            {steps.map(([h, p], i) => (
              <li key={h}><span className="n">{i + 1}</span><h3>{h}</h3><p>{p}</p></li>
            ))}
          </ol>
        </section>

        <section className="demo-section wrap" aria-labelledby="spec-title">
          <h2 id="spec-title">Pod spodem</h2>
          <p className="demo-sub">Krótko o tym, na czym to działa.</p>
          <dl className="spec" translate="no">
            {spec.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <p className="demo-callout">
            <b>Pamiętaj o ograniczeniach.</b> Oba demo są edukacyjne. Wyniki zależą od jakości obrazu i nie zastępują diagnozy lekarskiej ani instalacji przeciwpożarowej. Na wolniejszych urządzeniach analiza wideo nie nadąża za odtwarzaniem, więc ramki mogą się trochę spóźniać.
          </p>
          <p className="demo-links"><Link className="ulink" href="/#projekty">Zobacz projekty, z których pochodzą te modele</Link></p>
        </section>
      </main>
      <Footer page="about" />
    </>
  );
}
