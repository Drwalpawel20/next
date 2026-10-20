import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interaktywne demo modeli AI",
  description: "Uruchom w przeglądarce demo klasyfikacji MRI albo detekcji ognia i dymu na wideo.",
};

const tiles = [
  {
    href: "https://drwalpawel20.github.io/brain-tumor-demo/",
    kind: "Klasyfikacja obrazu · MRI",
    title: "Guz mózgu",
    body: "Wczytaj obraz MRI, zobacz trzy najbardziej prawdopodobne klasy i mapę uwagi Grad-CAM.",
    tags: ["30 klas", "TensorFlow.js", "Occlusion map"],
    external: true,
    symbol: "MRI",
  },
  {
    href: "/demos/fire-smoke",
    kind: "Detekcja obiektów · wideo",
    title: "Ogień i dym",
    body: "Uruchom model YOLO na własnym nagraniu. Detekcja działa lokalnie w przeglądarce.",
    tags: ["YOLO26s", "ONNX Runtime", "Fire · Smoke"],
    external: false,
    symbol: "YOLO",
  },
];

export default function DemosPage() {
  return (
    <>
      <Header page="demo" />
      <main className="demo-page">
        <section className="demo-hub wrap" aria-labelledby="demo-title">
          <p className="demo-kicker"><i className="live" /> LABORATORIUM MODELI</p>
          <h1 id="demo-title">Wybierz demo<span className="accent">.</span></h1>
          <p className="demo-lead">Dwa modele, dwa różne zadania. Otwórz wybrane demo i sprawdź je na własnych danych.</p>
          <div className="demo-grid">
            {tiles.map((tile, index) => {
              const content = (
                <>
                  <div className={`demo-art demo-art-${index}`} aria-hidden="true"><span>{tile.symbol}</span><i /><i /><i /></div>
                  <div className="demo-tile-body">
                    <p className="demo-tile-kind">{tile.kind}</p>
                    <h2>{tile.title}<span aria-hidden="true">↗</span></h2>
                    <p className="demo-tile-copy">{tile.body}</p>
                    <div className="demo-tags">{tile.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                    <span className="demo-open">Otwórz demo <b>→</b></span>
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
          <p className="demo-privacy">Model YOLO analizuje wideo na Twoim urządzeniu. Plik nie jest wysyłany na serwer.</p>
        </section>
      </main>
      <Footer page="about" />
    </>
  );
}
