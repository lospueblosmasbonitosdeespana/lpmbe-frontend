import type { Metadata } from "next";
import MapaPageClient from "./MapaPageClient";
import { getCanonicalUrl, getLocaleAlternates, SITE_NAME } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const path = "/mapa";
  const title = "Mapa interactivo | " + SITE_NAME;
  const description =
    "Explora el mapa interactivo con todos los pueblos más bonitos de España. Descubre su ubicación y planifica tu próxima escapada.";
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path),
      languages: getLocaleAlternates(path),
    },
    openGraph: { title, description, url: getCanonicalUrl(path) },
  };
}

export default function MapaPage() {
  return <MapaPageClient />;
}
