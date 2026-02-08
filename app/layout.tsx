import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">
        <GoogleAuthProviderWrapper>
          <WebAnalyticsTracker />
          <Header />
          {children}
          <Footer />
        </GoogleAuthProviderWrapper>
      </body>
    </html>
  );
}
