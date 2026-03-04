import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import MapaPageClient from "./MapaPageClient";
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, type SupportedLocale } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("seo");
  const path = "/mapa";
  const title = t("mapTitle");
  const description = t("mapDescription");
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
    },
  };
}

export default function MapaPage() {
  return <MapaPageClient />;
}
