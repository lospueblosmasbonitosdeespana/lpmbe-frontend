import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoTitle,
  seoDescription,
  type SupportedLocale,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const path = "/planifica/crea-mi-ruta";
  const title = seoTitle("Crea tu ruta");
  const description = seoDescription(
    "Genera una ruta personalizada entre dos puntos y descubre qué pueblos de Los Pueblos Más Bonitos de España y recursos turísticos asociados encontrarás por el camino.",
  );
  const ogDescription = seoDescription(
    "Genera una ruta personalizada y descubre pueblos bonitos y recursos turísticos a lo largo del camino.",
  );
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description: ogDescription,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
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
