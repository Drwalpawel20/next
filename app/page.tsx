import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Statement from "@/components/Statement";
import ProjectIndex from "@/components/ProjectIndex";
import StackTiles from "@/components/StackTiles";
import NeuralLab from "@/components/NeuralLab";
import ContactForm from "@/components/Contact";
import EmailLink from "@/components/EmailLink";
import Magnetic from "@/components/Magnetic";
import JsonLd from "@/components/JsonLd";
import { SITE } from "@/lib/site";
import { PROJECTS } from "@/lib/data";

const title = "Paweł Drwal – Portfolio | Python, ML, Kotlin, Java";
const description =
  "Portfolio Pawła Drwala, studenta informatyki. Projekty: klasyfikacja MRI (~97%), platforma e-commerce, Android SmartBudget, Camunda BPMN, ML ryzyka sercowo-naczyniowego. Open to work.";

export const metadata: Metadata = {
  title,
  description,
  keywords: ["Paweł Drwal", "portfolio", "Python", "machine learning", "Kotlin", "Java", "Android", "Camunda", "Big Data", "data science", "staż IT", "junior developer"],
  alternates: { canonical: SITE.url + "/" },
  openGraph: { type: "website", url: SITE.url + "/", title, description: "Projekty z zakresu ML, danych, Androida i automatyzacji procesów. Open to work." },
  twitter: { card: "summary", title: "Paweł Drwal – Portfolio", description: "Python, ML, Kotlin, Java: projekty, staż, open to work." },
};


const icon = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export default function Home() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Person", "@id": SITE.url + "/#me", name: SITE.name, url: SITE.url + "/", email: "mailto:" + SITE.email,
              jobTitle: "Student informatyki", sameAs: [SITE.github],
              description: "Machine learning, analiza danych, aplikacje mobilne i automatyzacja procesów.",
              knowsAbout: ["Python", "Machine Learning", "Kotlin", "Java", "Android", "Big Data", "Camunda", "BPMN", "Power BI", "PostgreSQL"],
            },
            { "@type": "WebSite", "@id": SITE.url + "/#site", url: SITE.url + "/", name: "Paweł Drwal – Portfolio", inLanguage: "pl-PL", publisher: { "@id": SITE.url + "/#me" } },
            {
              "@type": "ItemList", name: "Projekty", itemListElement: PROJECTS.filter((p) => !p.private).map((p, i) => ({
                "@type": "ListItem", position: i + 1, item: { "@type": "SoftwareSourceCode", name: p.title || p.name, description: p.desc, codeRepository: `${SITE.github}/${p.repo || p.name}`, programmingLanguage: p.lang },
              })),
            },
          ],
        }}
      />
      <Header page="home" />
      <main>
        <Hero />

        <section id="o-mnie">
          <div className="wrap">
            <Statement text="Najlepszy jest moment, w którym w stercie liczb nagle widać, o co w tym wszystkim chodzi." />
            <div className="two">
              <h2>O mnie</h2>
              <div className="prose">
                <p>Studiuję inżynierię danych, jestem na czwartym roku. Zaczęło się od analizy danych, potem wciągnęło mnie uczenie maszynowe. Do tej pory zrobiłem klasyfikator zdjęć MRI, hurtownię danych dla sklepu internetowego i aplikację na Androida do pilnowania budżetu.</p>
                <p>Szukam stażu albo pierwszej pracy, w której będę uczyć się od ludzi z większym doświadczeniem i robić rzeczy, z których ktoś naprawdę korzysta. Najchętniej hybrydowo w Krakowie, Rzeszowie lub Tarnowie. Zdalnie też działam, z dowolnego miejsca.</p>
                <p><a className="ulink" href="/about">Więcej o mnie</a></p>
              </div>
            </div>
          </div>
        </section>

        <section id="projekty">
          <div className="wrap">
            <div className="sh"><h2>Projekty</h2><span className="sh-line" /></div>
            <p className="sub">Kliknij projekt, żeby zobaczyć szczegóły, więcej zdjęć i link do kodu.</p>
            <ProjectIndex />
          </div>
        </section>

        <NeuralLab />

        <section id="demo">
          <div className="wrap">
            <div className="sh"><h2>Przetestuj w przeglądarce</h2><span className="sh-line" /></div>
            <p className="sub">Interaktywne demo jednego z moich modeli. Działa bez instalacji, a zdjęcie nie opuszcza Twojego urządzenia.</p>
            <div className="demo">
              <div>
                <p className="demo-tag"><i className="live" />Demo na żywo</p>
                <h3>Klasyfikator zdjęć MRI mózgu</h3>
                <p>Wgraj zdjęcie albo wybierz przykład. Model (30 klas) pokaże trzy najbardziej prawdopodobne odpowiedzi i zaznaczy obszary, które najmocniej wpłynęły na wynik.</p>
                <div className="tags" translate="no"><span>TensorFlow.js</span><span>Keras</span><span>Occlusion map</span></div>
                <p className="demo-note">Projekt edukacyjny, nie narzędzie do diagnozy.</p>
              </div>
              <Magnetic><a className="btn primary big" href="https://drwalpawel20.github.io/brain-tumor-demo/" target="_blank" rel="noopener">Uruchom demo</a></Magnetic>
            </div>
          </div>
        </section>

        <section id="playground">
          <div className="wrap">
            <div className="sh"><h2>Stack i narzędzia</h2><span className="sh-line" /></div>
            <p className="sub">Pasek na kafelku pokazuje, w ilu z moich projektów dana technologia się pojawia.</p>
            <StackTiles />
          </div>
        </section>

        <section id="perspektywa">
          <div className="wrap">
            <div className="sh"><h2>Poza kodem</h2><span className="sh-line" /></div>
            <p className="sub">Nie siedzę cały czas przed komputerem. Lubię rzeczy, przy których trzeba się skupić albo po prostu wyluzować.</p>
            <div className="beyond">
              <div className="prose">
                <h3>Szachy, siatkówka i rower</h3>
                <p>Odpoczywam na boisku, na rowerze albo przy szachownicy. Odrywam się od ekranu i wracam do projektów z czystszą głową.</p>
                <h3>Jak się uczę</h3>
                <p>Najwięcej wynoszę z projektów z prawdziwymi danymi i konkretnym problemem. Teoria zostaje w głowie dopiero wtedy, gdy coś się psuje i trzeba to naprawić.</p>
              </div>
              <ul className="hobbies">
                <li>
                  <svg viewBox="0 0 24 24" {...icon}><circle cx="12" cy="6.5" r="2.8" /><path d="M9.5 10.8h5M10.2 10.8c.1 2.4-.6 3.9-2.2 5.4M13.8 10.8c-.1 2.4.6 3.9 2.2 5.4M7 16.2h10M6 20h12l-1-3.8H7z" /></svg>
                  <b>Szachy</b><span>plan na kilka ruchów</span>
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
        </section>

        <section id="kontakt">
          <div className="wrap">
            <div className="sh"><h2>Kontakt</h2><span className="sh-line" /></div>
            <div className="contact">
              <div>
                <p className="sub">Masz pytanie, ofertę stażu albo pomysł na projekt? Napisz, odpowiem najszybciej, jak się da.</p>
                <ul className="links-c">
                  <li><EmailLink /></li>
                  <li><a href={SITE.github} target="_blank" rel="noopener">github.com/Drwalpawel20</a></li>
                </ul>
              </div>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
      <Footer page="home" />
    </>
  );
}
