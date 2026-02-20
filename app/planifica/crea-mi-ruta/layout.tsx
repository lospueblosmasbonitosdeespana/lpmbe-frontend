import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crea tu ruta",
  description:
    "Genera una ruta personalizada entre dos puntos y descubre qué pueblos de Los Pueblos Más Bonitos de España y recursos turísticos asociados encontrarás por el camino.",
  openGraph: {
    title: "Crea tu ruta | Los Pueblos Más Bonitos de España",
    description:
      "Genera una ruta personalizada y descubre pueblos bonitos y recursos turísticos a lo largo del camino.",
  },
};

export default function CreaMiRutaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
