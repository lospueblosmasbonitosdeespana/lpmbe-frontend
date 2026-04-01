import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  type SupportedLocale,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = "/planifica/crea-mi-ruta";
  const title = "Crea tu ruta";
  const description =
    "Genera una ruta personalizada entre dos puntos y descubre qué pueblos de Los Pueblos Más Bonitos de España y recursos turísticos asociados encontrarás por el camino.";
  const ogDescription =
    "Genera una ruta personalizada y descubre pueblos bonitos y recursos turísticos a lo largo del camino.";
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description: ogDescription,
    },
  };
}

export default function CreaMiRutaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
