import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FireSmokeDemo from "@/components/FireSmokeDemo";
import JsonLd from "@/components/JsonLd";
import { SITE } from "@/lib/site";

const title = "Wykrywanie ognia i dymu na wideo (YOLO) | Paweł Drwal";
const description = "Interaktywne demo modelu YOLO26s, który w przeglądarce wykrywa ogień i dym na nagraniach. Wybierz przykład albo wgraj własne wideo. Plik nie opuszcza Twojego urządzenia.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/demos/fire-smoke" },
  openGraph: { type: "website", title, description, url: "/demos/fire-smoke" },
  twitter: { card: "summary", title, description },
};

export default function FireSmokePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Wykrywanie ognia i dymu na wideo",
          url: SITE.url + "/demos/fire-smoke",
          applicationCategory: "EducationalApplication",
          operatingSystem: "Przeglądarka",
          inLanguage: "pl-PL",
          description,
          author: { "@type": "Person", name: SITE.name, url: SITE.url + "/" },
        }}
      />
      <Header page="demo" />
      <main className="demo-page"><FireSmokeDemo /></main>
      <Footer page="about" />
    </>
  );
}
