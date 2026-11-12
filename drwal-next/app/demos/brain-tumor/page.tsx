import Link from "next/link";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import BrainTumorDemo from "@/components/brain-tumor/BrainTumorDemo";
import { SITE } from "@/lib/site";
import styles from "@/components/brain-tumor/BrainTumor.module.css";

const title = "Klasyfikator zdjęć MRI mózgu: demo w przeglądarce | Paweł Drwal";
const description = "Wgraj zdjęcie MRI albo wybierz przykład. Model TensorFlow.js rozpoznaje jedną z 30 klas, pokazuje trzy najbardziej prawdopodobne i mapę Grad-CAM. Wszystko liczy się w przeglądarce.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["klasyfikacja MRI", "guzy mózgu", "TensorFlow.js", "Grad-CAM", "uczenie maszynowe", "Paweł Drwal", "demo"],
  alternates: { canonical: "/demos/brain-tumor" },
  openGraph: { type: "website", title, description, url: "/demos/brain-tumor" },
  twitter: { card: "summary", title, description },
};

export default function BrainTumorPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Klasyfikator zdjęć MRI mózgu",
          url: SITE.url + "/demos/brain-tumor",
          description,
          inLanguage: "pl-PL",
          applicationCategory: "EducationalApplication",
          operatingSystem: "Przeglądarka",
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: 0, priceCurrency: "PLN" },
          author: { "@type": "Person", name: SITE.name, url: SITE.url + "/" },
        }}
      />
      <Header page="demo" />
      <main className="demo-page">
        <section className="demo-hub wrap" aria-labelledby="mri-title">
          <p className="demo-kicker"><i className="live" /> DEMO W PRZEGLĄDARCE</p>
          <h1 id="mri-title">Guz mózgu na zdjęciu MRI<span className="accent">.</span></h1>
          <p className="demo-lead">Wgraj zdjęcie rezonansu albo wybierz przykład. Model TensorFlow.js analizuje obraz u Ciebie w przeglądarce i zwraca trzy najbardziej prawdopodobne klasy wraz z mapą Grad-CAM.</p>
          <ul className={styles.badges}>
            {["TensorFlow.js", "OpenCV.js", "30 klas", "260 × 260", "Grad-CAM", "działa lokalnie"].map((b) => <li key={b} translate="no">{b}</li>)}
          </ul>
          <p className="demo-callout">
            <b>Projekt edukacyjny, nie narzędzie do diagnozy.</b> Wyniki nie mają wartości medycznej i nie zastępują opinii lekarza ani opisu radiologicznego.
          </p>
          <BrainTumorDemo />
        </section>

        <section className="demo-section wrap" aria-labelledby="mri-how">
          <h2 id="mri-how">Co dzieje się ze zdjęciem</h2>
          <p className="demo-sub">Ten sam preprocessing, którego użyłem przy trenowaniu modelu w aplikacji desktopowej.</p>
          <p className="demo-callout">
            Najpierw obraz jest skalowany do 260 × 260 px, a tło usuwane maską mózgu (CLAHE, progi Otsu i percentyl, domknięcie morfologiczne, wybór składowej, otoczka wypukła, transformata odległości). Potem model klasyfikuje obraz do jednej z 30 klas (typ zmiany i sekwencja T1, T1C+ lub T2), a Grad-CAM zaznacza fragmenty, które najmocniej wpłynęły na wynik. Plik zostaje na Twoim urządzeniu.
          </p>
          <p className="demo-links">
            <Link className="ulink" href="/demos">Wróć do wszystkich demo</Link>{" · "}
            <Link className="ulink" href="/#projekty">Zobacz projekty</Link>
          </p>
        </section>
      </main>
      <Footer page="about" />
    </>
  );
}
