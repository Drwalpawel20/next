export const SITE = {
  name: "Paweł Drwal",
  // Główny adres portfolio. Bez zmian względem obecnej strony.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://drwalpawel20.github.io",
  // "O mnie" jest teraz częścią tej samej aplikacji: https://drwalpawel20.github.io/about
  aboutUrl: process.env.NEXT_PUBLIC_ABOUT_URL ?? (process.env.NEXT_PUBLIC_SITE_URL ?? "https://drwalpawel20.github.io") + "/about",
  // Stary adres na systeme.io. Zostaw tam przekierowanie (patrz README).
  legacyAbout: "https://drwalpawel20.systeme.io/about",
  email: "drwalpawel20@gmail.com",
  github: "https://github.com/Drwalpawel20",
  ga: "G-F06DSBTWTC",
  // Kody weryfikacji Google Search Console. Dotychczasowy plus dwa dla tego projektu.
  verification: "Jw4kLc6CY-Bh77x0zQh0P4lqgCo1pplHDn7jBxOZKng",
  cdn: "https://d1yei2z3i6k35z.cloudfront.net",
};
