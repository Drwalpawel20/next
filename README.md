# Portfolio Pawła Drwala (Next.js)

Next.js 15 (App Router, statyczny eksport) + Motion (animacje) + Lenis (płynny scroll). Zero zależności od CSS-frameworka.

## Start
    npm install
    npm run dev        # http://localhost:3000
    npm run build      # statyczna strona w katalogu out/

## Wdrożenie na GitHub Pages (drwalpawel20.github.io)
1. Wrzuć zawartość tego katalogu do repozytorium `Drwalpawel20.github.io` (gałąź `main`).
2. Settings > Pages > Source: GitHub Actions. Workflow jest w `.github/workflows/deploy.yml`.

## Adresy
- `/` zostaje pod https://drwalpawel20.github.io/ (kotwice #projekty, #demo, #perspektywa, #kontakt bez zmian).
- `/about` jest zbudowane tu, ale canonical i link "O mnie" wskazują na https://drwalpawel20.systeme.io/about,
  bo tam strona działa dzisiaj. Adresy ustawiasz w `lib/site.ts` (albo zmiennymi NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_ABOUT_URL).
- Demo MRI (`/brain-tumor-demo/`) to osobne repozytorium i nie jest ruszane.

## Gdzie co edytować
- Teksty projektów: `lib/data.ts`
- Teksty stron: `app/page.tsx`, `app/about/page.tsx`
- Kolory motywów i całe style: `app/globals.css` (tokeny na górze)
- Meta, JSON-LD, sitemap, robots: `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`

## "O mnie" i stary adres na systeme.io
Strona "O mnie" jest teraz częścią tej aplikacji i po wdrożeniu działa pod https://drwalpawel20.github.io/about.
Stary adres https://drwalpawel20.systeme.io/about nie da się przekierować kodem 301 (systeme.io tego nie pozwala),
więc zostaw tam jedną sekcję z własnym kodem w nagłówku strony:

    <link rel="canonical" href="https://drwalpawel20.github.io/about">
    <meta http-equiv="refresh" content="0; url=https://drwalpawel20.github.io/about">
    <script>location.replace("https://drwalpawel20.github.io/about")</script>

Jeśli wolisz, żeby oficjalnym adresem zostało systeme.io, ustaw NEXT_PUBLIC_ABOUT_URL na ten adres.
