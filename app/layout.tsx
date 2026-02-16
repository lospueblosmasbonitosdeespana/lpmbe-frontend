import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Header } from "./_components/nav/Header";
import { Footer } from "./_components/nav/Footer";
import GoogleAuthProviderWrapper from "./components/providers/GoogleAuthProvider";
import { WebAnalyticsTracker } from "@/components/analytics/WebAnalyticsTracker";

export const metadata: Metadata = {
  title: "LPBME 2.0",
  description: "Los Pueblos Más Bonitos de España",
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
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <GoogleAuthProviderWrapper>
            <WebAnalyticsTracker />
            <Header locale={locale} />
            {children}
            <Footer locale={locale} />
          </GoogleAuthProviderWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
