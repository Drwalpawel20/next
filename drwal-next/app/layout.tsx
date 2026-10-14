import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Cormorant_Garamond } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SITE } from "@/lib/site";
import SmoothScroll from "@/components/SmoothScroll";
import Cookie from "@/components/Cookie";

const head = Bricolage_Grotesque({ subsets: ["latin", "latin-ext"], variable: "--f-head", display: "swap" });
const body = Instrument_Sans({ subsets: ["latin", "latin-ext"], variable: "--f-body", display: "swap" });
const logo = Cormorant_Garamond({ subsets: ["latin", "latin-ext"], weight: ["600"], style: ["italic"], variable: "--f-logo", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  verification: { google: SITE.verification },
  openGraph: { locale: "pl_PL", siteName: "Paweł Drwal – Portfolio" },
};

export const viewport: Viewport = { themeColor: "#07080f", width: "device-width", initialScale: 1 };

/* Motyw bez migania + Consent Mode v2. Domyślnie wszystko "denied", dopiero zgoda użytkownika to zmienia. */
const boot = `(function(){try{var t=localStorage.getItem("theme");if(["blue","violet","forest","ocean","ember","gold"].indexOf(t)>-1)document.documentElement.setAttribute("data-theme",t)}catch(e){}
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;
gtag("consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",wait_for_update:500});
try{var c=JSON.parse(localStorage.getItem("pd_cookie_consent_v1")||"null");if(c&&c.version==="1.0"){gtag("consent","update",{analytics_storage:c.analytics?"granted":"denied",ad_storage:c.marketing?"granted":"denied",ad_user_data:c.marketing?"granted":"denied",ad_personalization:c.marketing?"granted":"denied"})}}catch(e){}
gtag("js",new Date());gtag("config","${SITE.ga}",{anonymize_ip:true});})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" data-theme="blue" suppressHydrationWarning className={`${head.variable} ${body.variable} ${logo.variable}`}>
      <head>
        <meta httpEquiv="content-language" content="pl" />
        <link rel="preconnect" href={SITE.cdn} crossOrigin="" />
        <script dangerouslySetInnerHTML={{ __html: boot }} />
      </head>
      <body>
        {children}
        <div id="google_translate_element" aria-hidden="true" />
        <SmoothScroll />
        <Cookie />
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${SITE.ga}`} strategy="afterInteractive" />
        {/* Działają tylko na Vercel. Na GitHub Pages nie są renderowane, żeby nie generować błędów 404. */}
        {process.env.VERCEL ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  );
}
