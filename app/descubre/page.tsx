import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getApiUrl } from "@/lib/api";
import { fetchWithTimeout } from "@/lib/fetch-safe";
import {
  getBaseUrl,
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  type SupportedLocale,
} from "@/lib/seo";
import { DescubreGrid } from "./DescubreGrid";
import JsonLd from "@/app/components/seo/JsonLd";

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
  const title = TITLES[locale] ?? TITLES.es;
  const description = DESCRIPTIONS[locale] ?? DESCRIPTIONS.es;

  let ogImage: string | null = null;
  try {
    const collections = await getCollections(locale);
    ogImage = collections.find((c) => c?.imageUrl)?.imageUrl ?? null;
  } catch {
    ogImage = null;
  }
  const finalOgImage = ogImage ?? `${getBaseUrl()}/brand/logo-lpbe-1.png`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
      type: "website",
      images: [{ url: finalOgImage, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [finalOgImage],
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
  imageUrl?: string | null;
  count?: number;
};

async function getCollections(locale: string): Promise<Collection[]> {
  const API_BASE = getApiUrl();
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/public/descubre?lang=${encodeURIComponent(locale)}`,
      { cache: "no-store", timeoutMs: 8000 },
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

  const base = getBaseUrl();
  const pageUrl = getCanonicalUrl("/descubre", locale as SupportedLocale);
  const title = TITLES[locale] ?? TITLES.es;
  const description = DESCRIPTIONS[locale] ?? DESCRIPTIONS.es;
  const firstCoverCollection = collections.find((c) => c?.imageUrl) ?? null;

  const collectionLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: pageUrl,
    inLanguage: locale,
    ...(firstCoverCollection?.imageUrl ? { image: firstCoverCollection.imageUrl } : {}),
    isPartOf: {
      "@type": "WebSite",
      name: "Los Pueblos Más Bonitos de España",
      url: base,
    },
    mainEntity:
      collections.length > 0
        ? {
            "@type": "ItemList",
            numberOfItems: collections.length,
            itemListElement: collections.slice(0, 100).map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${base}/descubre/${c.slug}`,
              name: c.title,
            })),
          }
        : undefined,
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: base },
      { "@type": "ListItem", position: 2, name: hero.main, item: pageUrl },
    ],
  };

  return (
    <main className="min-h-screen">
      <JsonLd data={collectionLd} />
      <JsonLd data={breadcrumbLd} />
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
