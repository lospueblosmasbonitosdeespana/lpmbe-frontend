import "./globals.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Header } from "./_components/nav/Header";
import { Footer } from "./_components/nav/Footer";
import GoogleAuthProviderWrapper from "./components/providers/GoogleAuthProvider";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { WebAnalyticsTracker } from "@/components/analytics/WebAnalyticsTracker";
import {
  getBaseUrl,
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  getLocaleAlternates,
  pathForLocale,
  getOGLocale,
  type SupportedLocale,
} from "@/lib/seo";
import JsonLd from "./components/seo/JsonLd";
import CountdownHydrator from "./_components/CountdownHydrator";
import ExplorarBar from "./_components/nav/ExplorarBar";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "optional",
  variable: "--font-serif",
});

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "optional",
  variable: "--font-sans",
});

const baseUrl = getBaseUrl();
const METRICOOL_HASH = "18832f16626b6e6fe6fd0d0d28e26671";

// Evitar cache para que generateMetadata use siempre la ruta real (x-current-path) y los hreflang sean correctos.
export const dynamic = 'force-dynamic';

function normalizeMetadataPath(pathname: string | null): string {
  if (!pathname || pathname.trim() === "") return "/";
  const clean = pathname.split("?")[0].trim();
  if (!clean.startsWith("/")) return `/${clean}`;
  if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
  return clean;
}

function resolveLocale(rawLocale: string | null): SupportedLocale {
  switch (rawLocale) {
    case "en":
    case "fr":
    case "de":
    case "pt":
    case "it":
    case "ca":
      return rawLocale;
    default:
      return "es";
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const metadataPath = normalizeMetadataPath(hdrs.get("x-current-path"));
  const requestLocale = resolveLocale(hdrs.get("x-current-locale"));
  const languageAlternates = getLocaleAlternates(metadataPath);
  const canonicalPath = pathForLocale(metadataPath, requestLocale);

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${SITE_NAME} – Pueblos, rutas y experiencias`,
      template: `%s | ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    icons: {
      icon: [
        { url: "/brand/logo-favicon.png", sizes: "48x48", type: "image/png" },
        { url: "/brand/logo-favicon.png", sizes: "32x32", type: "image/png" },
      ],
      apple: "/brand/logo-favicon.png",
    },
    openGraph: {
      siteName: SITE_NAME,
      locale: getOGLocale(requestLocale),
      type: "website",
      description: DEFAULT_DESCRIPTION,
      images: [{ url: `${baseUrl}/brand/logo-favicon.png`, width: 512, height: 512, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      images: [`${baseUrl}/brand/logo-favicon.png`],
    },
    alternates: {
      canonical: canonicalPath,
      languages: languageAlternates,
    },
    robots: { index: true, follow: true },
    other: {
      "apple-itunes-app": "app-id=6755147967",
      // Forzar que los iconos añadidos al "home screen" del iPhone se abran
      // como Safari completo (con barras de navegación y compartir), NO como
      // web app standalone que oculta toda la UI del navegador.
      "apple-mobile-web-app-capable": "no",
      "mobile-web-app-capable": "no",
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  const base = getBaseUrl();
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: base,
    logo: `${base}/brand/logo-favicon.png`,
    sameAs: [
      "https://www.facebook.com/lospueblosmasbonitos",
      "https://www.instagram.com/lospueblosmasbonitosdeespana",
      "https://www.youtube.com/@lospueblosmasbonitos",
    ],
  };

  // WebSite JSON-LD + SearchAction: habilita el sitelinks searchbox en Google
  // (la query se redirige a /pueblos?search=...). Ver schema.org/SearchAction.
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: base,
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/pueblos?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang={locale} className={`${playfairDisplay.variable} ${sourceSans3.variable}`} suppressHydrationWarning>
      <body className="antialiased">
        <GoogleTagManager />
        <Script id="metricool-init" strategy="afterInteractive">
          {`(function () {
  function loadScript(cb) {
    var head = document.getElementsByTagName("head")[0];
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://tracker.metricool.com/resources/be.js";
    script.onreadystatechange = cb;
    script.onload = cb;
    head.appendChild(script);
  }
  loadScript(function () {
    if (window.beTracker && typeof window.beTracker.t === "function") {
      window.beTracker.t({ hash: "${METRICOOL_HASH}" });
    }
  });
})();`}
        </Script>
        <JsonLd data={organizationLd} />
        <JsonLd data={websiteLd} />
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <GoogleAuthProviderWrapper>
              <WebAnalyticsTracker />
              <CountdownHydrator />
              <Header locale={locale} />
              <ExplorarBar />
              {children}
              <Footer locale={locale} />
              <SpeedInsights />
            </GoogleAuthProviderWrapper>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
