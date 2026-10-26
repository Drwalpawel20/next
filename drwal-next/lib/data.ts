const C = "https://d1yei2z3i6k35z.cloudfront.net/19288860/";

export type Slide = { img: string; cap: string; fb?: string };
export type Project = {
  name: string;
  title?: string;
  repo?: string;
  lang: string;
  desc: string;
  long: string;
  points: string[];
  tags: string[];
  slides: Slide[];
  metrics?: { l: string; v: string }[];
  private?: boolean;
  demo?: string;
  portrait?: boolean;
  fit?: boolean;
};

export const LANG_COLORS: Record<string, string> = {
  Python: "#5b86ff",
  Kotlin: "#a78bfa",
  Java: "#fb923c",
  JavaScript: "#e8c547",
  "Power BI": "#f2c811",
  MATLAB: "#f0793a",
};

export const FILTERS = ["Python", "Kotlin", "Java", "JavaScript", "Power BI", "MATLAB"];

export const PROJECTS: Project[] = [
  {
    name: "fire-smoke-yolo",
    title: "Wykrywanie ognia i dymu (YOLO26s)",
    lang: "Python",
    private: true,
    demo: "/demos/fire-smoke",
    desc: "Model YOLO26s wykrywa ogień i dym na nagraniach wideo. Działa w aplikacji desktopowej i w przeglądarce.",
    long: "Detektor obiektów YOLO26s z dwiema klasami: ogień i dym. Do testów napisałem aplikację desktopową w PySide6, która analizuje film klatka po klatce, pokazuje FPS i czas inferencji, zlicza wykrycia i potrafi zapisać wynik jako nowe wideo. Ten sam model, wyeksportowany do ONNX, działa też w przeglądarce na stronie z demo: na karcie graficznej (WebGPU) albo na procesorze (WebAssembly), bez wysyłania pliku na serwer. Projekt edukacyjny, nie system alarmowy.",
    points: [
      "Dwie klasy, ogień i dym, wejście 640 px",
      "Aplikacja desktopowa w PySide6: podgląd na żywo, FPS, czas klatki, statystyki wykryć",
      "Przewijanie, pauza i eksport nagrania z naniesionymi ramkami",
      "Eksport do ONNX i demo w przeglądarce (WebGPU lub WebAssembly)",
    ],
    tags: ["Python", "YOLO26s", "Ultralytics", "PySide6", "OpenCV", "ONNX"],
    metrics: [{ l: "Klasy", v: "2" }, { l: "Wejście", v: "640 px" }, { l: "Eksport", v: "ONNX" }],
    slides: [
      { img: "/projects/yolo-fire-smoke-1.webp", cap: "Ogień i dym wykryte na nagraniu z kamery" },
      { img: "/projects/yolo-fire-smoke-2.webp", cap: "Nocny pożar: wiele ramek ognia i jedna ramka dymu" },
      { img: "/projects/yolo-fire-smoke-3.webp", cap: "Ogień i dym na nagraniu nocnym" },
    ],
  },
  {
    name: "matlab-fordfulkerson",
    title: "Maksymalny przepływ: Ford-Fulkerson w MATLAB-ie",
    lang: "MATLAB",
    fit: true,
    desc: "Aplikacja w MATLAB-ie liczy maksymalny przepływ w sieci i pokazuje krok po kroku, jak BFS szuka ścieżek powiększających.",
    long: "Graf wpisuje się jako macierz sąsiedztwa, do tego węzeł źródłowy i ujście. Aplikacja uruchamia algorytm Forda-Fulkersona z przeszukiwaniem wszerz (BFS) i animuje każdy krok: który węzeł jest właśnie odwiedzany i którą ścieżką idzie powiększanie przepływu. Po zakończeniu pokazuje wynik na grafie, z przepływem i przepustowością przy każdej krawędzi (np. 6/13), oraz listę użytych ścieżek z ich przepływem. W przykładowym grafie z 10 węzłami wychodzi maksymalny przepływ 18.",
    points: [
      "Macierz sąsiedztwa, źródło i ujście wpisywane w oknie aplikacji",
      "Animacja przeszukiwania BFS po węzłach",
      "Lista użytych ścieżek wraz z przepływem każdej z nich",
      "Wynik końcowy na grafie: przepływ i przepustowość przy każdej krawędzi",
    ],
    tags: ["MATLAB", "Ford-Fulkerson", "BFS", "Teoria grafów", "GUI"],
    metrics: [{ l: "Węzły w przykładzie", v: "10" }, { l: "Maksymalny przepływ", v: "18" }, { l: "Ścieżki powiększające", v: "4" }],
    slides: [
      { img: "/projects/ford-fulkerson-wynik.webp", cap: "Wynik końcowy: maksymalny przepływ 18" },
      { img: "/projects/ford-fulkerson-bfs.webp", cap: "BFS w trakcie przeszukiwania węzła 8" },
    ],
  },
  {
    name: "Equipment-Decommissioning",
    title: "ADMORA: generator orzeczeń technicznych",
    lang: "Python",
    desc: "Aplikacja desktopowa do orzeczeń technicznych przy likwidacji sprzętu: skan kodu, dane z PostgreSQL, szablon, wydruk.",
    long: "Operator skanuje albo wpisuje kod ST, a aplikacja pobiera z PostgreSQL specyfikację i komponenty urządzenia. Dane można poprawić, potem wybiera się szablon ODT, generuje dokument i drukuje gotowe orzeczenie. Program zna różne typy obiektów, pozwala edytować szablony, czyta dane techniczne z plików XLS, a połączenie z bazą konfiguruje się zmiennymi środowiskowymi.",
    points: [
      "Cały przepływ w jednym oknie: skan, baza, weryfikacja, dokument, druk",
      "PostgreSQL i import danych z XLS",
      "Szablony ODT dopasowane do typu urządzenia",
      "Obsługa czytników kodów i druku bezpośrednio z aplikacji",
    ],
    tags: ["Python", "PostgreSQL", "ODT", "Excel", "Skaner kodów", "Druk"],
    slides: [
      { img: C + "6aca3893b54252.82262734_admora-01-glowny-ekran.png", cap: "Główny ekran i podgląd orzeczenia" },
      { img: C + "6aca3893aba1e4.76648297_admora-02-szablony.png", cap: "Zarządzanie szablonami dokumentów" },
      { img: C + "6aca3893b6c048.02107039_admora-03-nowy-obiekt.png", cap: "Dodawanie nowego typu obiektu" },
    ],
  },
  {
    name: "aplikacja_kliniczna",
    title: "Klasyfikator zdjęć MRI mózgu",
    lang: "Python",
    private: true,
    demo: "https://drwalpawel20.github.io/brain-tumor-demo/",
    desc: "Rozpoznaje typ guza na zdjęciu MRI (30 klas) i pokazuje, na co patrzył model. Trafność ok. 97%.",
    long: "Aplikacja desktopowa. Najpierw czyści obraz z tła, potem model Keras (ok. 97% trafności, 30 klas: typ zmiany i sekwencja T1, T1C+, T2) podaje trzy najbardziej prawdopodobne odpowiedzi, a Grad-CAM zaznacza miejsca, które miały największy wpływ na wynik. Interfejs w Tkinterze, po polsku i angielsku. To projekt edukacyjny, nie narzędzie do diagnozy.",
    points: [
      "Preprocessing MRI i usuwanie tła przed klasyfikacją",
      "Model Keras, ok. 97% accuracy, 30 klas",
      "Grad-CAM i ranking Top-3",
      "GUI w Tkinterze z drag and drop, PL i EN",
    ],
    tags: ["Python", "TensorFlow", "OpenCV", "MRI", "Grad-CAM"],
    metrics: [{ l: "Accuracy", v: "~97%" }, { l: "Klasy", v: "30" }, { l: "Grad-CAM", v: "tak" }],
    slides: [
      { img: C + "6ac2b5d08be993.07237305_brain-tumor-1.png", fb: "https://d1yei2z3i6k35z.cloudfront.net/thumb_150/6ac2b5d08be993.07237305_brain-tumor-1.png", cap: "Hemangiopericytoma T2, 99.4%" },
      { img: C + "6ac2b5d0844067.60645535_brain-tumor-2.png", cap: "Oponiak T1C+, 97.3%" },
    ],
  },
  {
    name: "ecommerce-data-platform",
    title: "Hurtownia danych sklepu internetowego",
    lang: "Python",
    desc: "Fikcyjny sklep w PostgreSQL: ETL, widoki SQL, segmentacja klientów, prognoza sprzedaży i dashboardy Power BI.",
    long: "Cały łańcuch analityczny na wygenerowanych danych. Ok. 500 tys. zamówień trafia przez ETL do hurtowni w PostgreSQL, potem jest analiza w SQL, wykrywanie anomalii, segmentacja klientów (RFM i K-Means) i prognoza sprzedaży z błędem MAE ok. 6,4%. Power BI łączy się wprost z serwerem bazy i pracuje na widokach SQL.",
    points: [
      "Generator danych i ETL do PostgreSQL (schemat gwiazdy)",
      "Widoki SQL i Power BI podpięty do serwera bazy",
      "RFM, K-Means, Isolation Forest, prognozowanie",
      "14 testów jakości danych w SQL",
    ],
    tags: ["Python", "PostgreSQL", "SQL views", "scikit-learn", "Power BI", "ETL"],
    metrics: [{ l: "Zamówienia", v: "500k" }, { l: "Forecast MAE", v: "6.4%" }, { l: "Revenue CAGR", v: "+9%" }],
    slides: [
      { img: C + "6ac2b5d08a90f0.09895580_ecom-1.png", cap: "Trend przychodów" },
      { img: C + "6ac2b5d08eb176.91197756_ecom-2.png", cap: "Prognoza na 365 dni" },
      { img: C + "6ac2b5d089a513.13456871_ecom-3.png", cap: "Segmenty klientów (PCA)" },
    ],
  },
  {
    name: "ecommerce-powerbi-dashboard",
    title: "E-commerce Power BI Dashboard",
    repo: "ecommerce-data-platform",
    lang: "Power BI",
    desc: "Cztery strony raportu na danych sklepu: Executive, Sales, Product i Customer. Dane prosto z PostgreSQL.",
    long: "Raport zbudowany na hurtowni sklepu online (ok. 500 tys. zamówień). Power BI łączy się bezpośrednio z PostgreSQL i korzysta z widoków SQL, więc logika biznesowa siedzi w bazie, a nie w raporcie. Cztery strony w ciemnym motywie: podsumowanie dla zarządu, sprzedaż w czasie, produkty i dostawcy oraz klienci z podziałem na kraje.",
    points: [
      "Executive: przychód, zysk, marża, zamówienia, AOV, mapa przychodów wg kraju",
      "Sales: trend przychodu i zysku, kwartały, filtry rok i miesiąc",
      "Product: top 10 wg przychodu i zysku, koszty wg dostawcy",
      "Customer: ok. 50 tys. klientów, udział krajów, najlepsi klienci",
    ],
    tags: ["Power BI", "PostgreSQL", "SQL views", "DAX", "Dashboard"],
    metrics: [{ l: "Przychód", v: "294.6M" }, { l: "Marża", v: "24.9%" }, { l: "Zamówienia", v: "500k" }, { l: "Klienci", v: "~50k" }],
    slides: [
      { img: C + "6ac4036f826747.86826592_pbi-executive.jpg", cap: "Executive Dashboard" },
      { img: C + "6ac4036f78ff01.57877606_pbi-sales.jpg", cap: "Sales Analysis" },
      { img: C + "6ac4036f7df154.50442872_pbi-product.jpg", cap: "Product Analysis" },
      { img: C + "6ac4036f7f2930.80856322_pbi-customer.jpg", cap: "Customer Analysis" },
    ],
  },
  {
    name: "SmartBudgetPro-Android",
    title: "SmartBudget Pro",
    lang: "Kotlin",
    portrait: true,
    desc: "Aplikacja na Androida do pilnowania wydatków: kategorie, wykresy, kursy inwestycji, eksport do CSV. Działa offline.",
    long: "Kotlin, MVVM, Hilt i Room. Dodajesz wydatki, ustawiasz budżety z powiadomieniami i oglądasz statystyki na wykresach. Są też kursy inwestycji pobierane z API i eksport do CSV. Dane trzymane lokalnie, więc wszystko działa bez internetu.",
    points: ["MVVM, Hilt, Room", "Wydatki, budżety, statystyki miesięczne", "Inwestycje z API (Retrofit)", "Eksport CSV"],
    tags: ["Kotlin", "Android", "Room", "Hilt", "MVVM"],
    slides: [{ img: C + "6ac4036f7915c6.86102979_smartbudget-1.jpg", cap: "Zakładka Inwestuj z polecanymi kryptowalutami" }],
  },
  {
  name: "BPMN-CAMUNDA-8",
  title: "Wniosek o miejsce parkingowe (Camunda 8)",
  lang: "Java",
  desc: "Wniosek przechodzi cały proces sam: formularz, sprawdzenie w bazie, decyzja i mail. Camunda 8 i Spring Boot.",
  long: "Proces na Camunda 8 SaaS do obsługi wniosków o miejsce parkingowe. Formularz trafia do weryfikacji w PostgreSQL (studenci, pracownicy, wolne miejsca), proces podejmuje decyzję, a wnioskodawca dostaje maila. Backend w Javie i Spring Boot.",
  points: ["Modele BPMN i workery w Javie", "Camunda 8 SaaS i Spring Boot", "PostgreSQL: miejsca, studenci, pracownicy", "Powiadomienia e-mail"],
  tags: ["Java", "Camunda 8", "BPMN", "Spring Boot", "PostgreSQL"],
  slides: [
    { img: "/projects/bpmn1.jpg", cap: "Diagram BPMN procesu wniosku" },
    { img: "/projects/bpmn2.jpg", cap: "Model procesu w Camunda 8" },
    { img: "/projects/bpmn3.jpg", cap: "Przebieg procesu i taski" },
    { img: "/projects/bpmnform.jpg", cap: "Formularz wniosku o miejsce parkingowe" },
  ],
},
  {
    name: "cardiovascular_risk",
    title: "Ryzyko chorób serca",
    lang: "Python",
    desc: "Model oceniający ryzyko sercowo-naczyniowe (niskie, średnie, wysokie) i proste okienko do wpisywania danych.",
    long: "Przygotowałem dane (braki, transformacje, obserwacje odstające), porównałem kilka modeli (RF, SVM, XGBoost, LightGBM, CatBoost) i zapisałem cały pipeline w joblib. Do tego prosta aplikacja w Tkinterze. Trafność ok. 97%. Projekt edukacyjny, nie diagnoza.",
    points: ["Porównanie wielu klasyfikatorów", "Pipeline zapisany w joblib", "Aplikacja desktopowa w Tkinterze", "Ok. 97% accuracy na ewaluacji"],
    tags: ["Python", "scikit-learn", "XGBoost", "Tkinter", "ML"],
    metrics: [{ l: "Accuracy", v: "~97%" }, { l: "Klasy", v: "3" }, { l: "GUI", v: "Tkinter" }],
    slides: [],
  },
  {
    name: "Big_data",
    title: "Prognoza wilgotności z Open-Meteo",
    lang: "Python",
    desc: "Prognoza wilgotności powietrza na 1 do 6 godzin do przodu, liczona na bieżąco z danych Open-Meteo.",
    long: "System prognozuje wilgotność względną na dwa sposoby: multi-step i rekurencyjnie. Cechy to m.in. opóźnienia i średnie kroczące, a całość testuję na symulatorze strumienia godzinowych danych. W repozytorium są model, metryki i wykresy.",
    points: ["Multi-step kontra recursive forecasting", "Dane Open-Meteo, horyzont od +1 do +6 h", "Symulator strumienia i ewaluacja", "Te same cechy w treningu i w inferencji"],
    tags: ["Python", "Forecasting", "Open-Meteo", "Streaming", "ML"],
    slides: [
      { img: C + "6ac2b5d0877566.24982627_bigdata-1.png", cap: "Ewaluacja horyzontu +1 h" },
      { img: C + "6ac2b5d0828246.07915953_bigdata-2.png", fb: "https://d1yei2z3i6k35z.cloudfront.net/thumb_150/6ac2b5d0828246.07915953_bigdata-2.png", cap: "Prognoza wielohoryzontowa na 6 h" },
    ],
  },
  {
    name: "M-M-FIFO-INFINITE",
    title: "Kolejki M/M/m z optymalizacją CSO",
    lang: "Python",
    desc: "Analiza systemów kolejkowych M/M/m i dobór liczby stanowisk algorytmem Cockroach Swarm Optimization.",
    long: "Aplikacja w Tkinterze do analizy systemów M/M/m/FIFO/∞. Z intensywności napływu λ, intensywności obsługi μ i liczby kanałów liczy wykorzystanie stanowisk, długość kolejki, czasy oczekiwania i rozkład P0…Pn. Moduł optymalizacji szuka algorytmem CSO liczby stanowisk, która minimalizuje koszt J(m) = C1·L + C2·m. Wyniki można porównać przed i po optymalizacji.",
    points: ["Wzory Erlanga C i prawdopodobieństwa P0…Pn", "Optymalizacja liczby stanowisk algorytmem CSO", "Funkcja kosztu J(m) = C1·L + C2·m", "Porównanie wyników przed i po"],
    tags: ["Python", "Tkinter", "NumPy", "Teoria kolejek", "CSO"],
    slides: [
      { img: C + "6aca3893a31fc2.91513658_kolejki-01-analiza.png", cap: "Analiza parametrów systemu kolejkowego" },
      { img: C + "6aca3893ac08d4.54171655_kolejki-02-optymalizacja.png", cap: "Optymalizacja liczby stanowisk algorytmem CSO" },
      { img: C + "6aca3893b44e80.35552445_kolejki-03-porownanie.png", cap: "Parametry przed i po optymalizacji" },
    ],
  },
  {
    name: "color_filtering",
    title: "Edytor zdjęć: przestrzenie barw i filtry",
    lang: "Python",
    desc: "Edytor obrazu z korekcją kolorów, szumami, odszumianiem i podglądem kanałów w HSV oraz CIELAB.",
    long: "Tkinter, Pillow i OpenCV. Program koryguje balans RGB, odcień i nasycenie, robi sepię, equalizację histogramu, rozmywanie i wyostrzanie. Potrafi dodać szum gaussowski albo sól i pieprz, a potem go usunąć filtrami: medianowym, Gaussa i medianą wektorową. Osobne widoki pokazują kanały HSV i CIELAB oraz obraz przed i po przetworzeniu.",
    points: ["Korekcja RGB, odcienia, nasycenia, sepii i histogramu", "Szum gaussowski i sól z pieprzem", "Filtry medianowe, Gaussa i mediana wektorowa", "Kanały HSV i CIELAB przed i po"],
    tags: ["Python", "Pillow", "OpenCV", "Tkinter", "HSV", "CIELAB"],
    slides: [
      { img: C + "6aca3893baab86.75443171_color-filtering-01-korekcja.png", cap: "Korekcja kolorów i equalizacja histogramu" },
      { img: C + "6aca3893abfd20.32492173_color-filtering-02-szum.png", cap: "Szum gaussowski i impulsowy" },
      { img: C + "6aca3895a7d0a8.36504832_color-filtering-03-filtry.png", cap: "Porównanie filtrów odszumiających" },
      { img: C + "6aca38939f6f66.73200522_color-filtering-04-hsv-kanaly.png", cap: "Kanały przestrzeni HSV" },
      { img: C + "6aca3893a0df22.22402782_color-filtering-05-cielab-kanaly.png", cap: "Kanały przestrzeni CIELAB" },
    ],
  },
  {
    name: "margonem-player-nick-color",
    title: "Kolorowe nicki w Margonem",
    lang: "JavaScript",
    desc: "Skrypt do Margonem, który koloruje nicki graczy: osobno znajomi, wrogowie, klan i drużyna.",
    long: "Skrypt na Tampermonkey, który zamienia biały kolor nicków nad graczami na kolor zależny od relacji: zielony dla sojuszników, czerwony dla wrogów, pomarańczowy dla klanu, niebieski dla drużyny. Działa tylko w Nowym Interfejsie.",
    points: ["Kolory według relacji w grze", "Konfiguracja HEX na początku skryptu", "Instalacja przez Tampermonkey", "Tylko Margonem NI"],
    tags: ["JavaScript", "Userscript", "Tampermonkey"],
    slides: [],
  },
];
