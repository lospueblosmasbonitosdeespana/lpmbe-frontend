import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Header } from "./_components/nav/Header";
import { Footer } from "./_components/nav/Footer";
import GoogleAuthProviderWrapper from "./components/providers/GoogleAuthProvider";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import { WebAnalyticsTracker } from "@/components/analytics/WebAnalyticsTracker";
import { getBaseUrl, SITE_NAME, DEFAULT_DESCRIPTION } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: {
    default: `${SITE_NAME} – Pueblos, rutas y experiencias`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    siteName: SITE_NAME,
    locale: "es_ES",
    type: "website",
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "/",
  },
  robots: { index: true, follow: true },
};

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

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <GoogleAuthProviderWrapper>
              <WebAnalyticsTracker />
              <Header locale={locale} />
              {children}
              <Footer locale={locale} />
            </GoogleAuthProviderWrapper>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
