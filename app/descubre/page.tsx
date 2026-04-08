import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getApiUrl } from "@/lib/api";
import { fetchWithTimeout } from "@/lib/fetch-safe";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  type SupportedLocale,
} from "@/lib/seo";
import { DescubreGrid } from "./DescubreGrid";

export const dynamic = "force-dynamic";

const TITLES: Record<string, string> = {
  es: "Descubre | Colecciones temáticas de pueblos",
  en: "Discover | Themed village collections",
  fr: "Découvrir | Collections thématiques de villages",
  de: "Entdecken | Thematische Dörfersammlungen",
  pt: "Descobrir | Coleções temáticas de aldeias",
  it: "Scopri | Collezioni tematiche di borghi",
  ca: "Descobreix | Col·leccions temàtiques de pobles",
};

const DESCRIPTIONS: Record<string, string> = {
  es: "Explora los pueblos más bonitos de España por temáticas: castillos, montaña, costa, islas, autocaravanas, familias y tiempo en directo.",
  en: "Explore the most beautiful villages in Spain by theme: castles, mountains, coast, islands, motorhomes, families and live weather.",
  fr: "Explorez les plus beaux villages d'Espagne par thème: châteaux, montagne, côte, îles et météo en direct.",
  de: "Entdecken Sie Spaniens schönste Dörfer nach Themen: Burgen, Berge, Küste, Inseln und Live-Wetter.",
  pt: "Explore as aldeias mais bonitas de Espanha por tema: castelos, montanha, costa, ilhas e meteorologia ao vivo.",
  it: "Esplora i borghi più belli della Spagna per tema: castelli, montagna, costa, isole e meteo in diretta.",
  ca: "Explora els pobles més bonics d'Espanya per temàtica: castells, muntanya, costa, illes i temps en directe.",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const path = "/descubre";
  return {
    title: { absolute: TITLES[locale] ?? TITLES.es },
    description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.es,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title: TITLES[locale] ?? TITLES.es,
      description: DESCRIPTIONS[locale] ?? DESCRIPTIONS.es,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
    },
  };
}

type Collection = {
  slug: string;
  type: string;
  icon: string;
  color: string;
  title: string;
  description: string;
};

async function getCollections(locale: string): Promise<Collection[]> {
  const API_BASE = getApiUrl();
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/public/descubre?lang=${encodeURIComponent(locale)}`,
      { next: { revalidate: 300 }, timeoutMs: 8000 },
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

const HERO_TITLES: Record<string, { main: string; sub: string }> = {
  es: { main: "Descubre", sub: "Explora los pueblos más bonitos de España por temáticas únicas" },
  en: { main: "Discover", sub: "Explore Spain's most beautiful villages by unique themes" },
  fr: { main: "Découvrir", sub: "Explorez les plus beaux villages d'Espagne par thèmes uniques" },
  de: { main: "Entdecken", sub: "Erkunden Sie Spaniens schönste Dörfer nach einzigartigen Themen" },
  pt: { main: "Descobrir", sub: "Explore as aldeias mais bonitas de Espanha por temas únicos" },
  it: { main: "Scopri", sub: "Esplora i borghi più belli della Spagna per temi unici" },
  ca: { main: "Descobreix", sub: "Explora els pobles més bonics d'Espanya per temàtiques úniques" },
};

export default async function DescubrePage() {
  const locale = await getLocale();
  const collections = await getCollections(locale);
  const hero = HERO_TITLES[locale] ?? HERO_TITLES.es;

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#3d2c1e] via-[#5a3d28] to-[#4a6741] py-20 md:py-28">
        <div className="absolute inset-0 bg-[url('/brand/pattern-subtle.svg')] opacity-5" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <h1 className="font-serif text-4xl font-bold text-white md:text-6xl tracking-tight">
            {hero.main}
          </h1>
          <p className="mt-4 text-lg text-white/80 md:text-xl max-w-2xl mx-auto">
            {hero.sub}
          </p>
        </div>
      </section>

      <DescubreGrid collections={collections} locale={locale} />
    </main>
  );
}
