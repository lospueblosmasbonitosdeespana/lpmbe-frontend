import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { Header } from "./_components/nav/Header";
import GoogleAuthProviderWrapper from "./components/providers/GoogleAuthProvider";

export const metadata: Metadata = {
  title: "LPBME 2.0",
  description: "Los Pueblos Más Bonitos de España",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <GoogleAuthProviderWrapper>
          <Header />
          {children}
        </GoogleAuthProviderWrapper>
      </body>
    </html>
  );
}
