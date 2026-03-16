import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { headers } from "next/headers";
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
  getOGLocale,
  type SupportedLocale,
} from "@/lib/seo";
import JsonLd from "./components/seo/JsonLd";

const baseUrl = getBaseUrl();

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
      canonical: metadataPath,
      languages: languageAlternates,
    },
    robots: { index: true, follow: true },
    other: {
      "apple-itunes-app": "app-id=6755147967",
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

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: getBaseUrl(),
    logo: `${getBaseUrl()}/brand/logo-favicon.png`,
    sameAs: [
      "https://www.facebook.com/lospueblosmasbonitos",
      "https://www.instagram.com/lospueblosmasbonitosdeespana",
      "https://www.youtube.com/@lospueblosmasbonitos",
    ],
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">
        <GoogleTagManager />
        <JsonLd data={organizationLd} />
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <GoogleAuthProviderWrapper>
              <WebAnalyticsTracker />
              <Header locale={locale} />
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
