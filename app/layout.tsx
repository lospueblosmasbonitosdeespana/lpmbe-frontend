import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { Header } from "./_components/nav/Header";

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
        <Header />
        {children}
      </body>
    </html>
  );
}
