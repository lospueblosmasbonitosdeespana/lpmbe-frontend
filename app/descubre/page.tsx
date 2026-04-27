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
import DescubreIntroBlock from "./DescubreIntroBlock";
import JsonLd from "@/app/components/seo/JsonLd";

export const dynamic = "force-dynamic";

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

type Intro = {
  h1: string;
  sub: string;
  seoTitle: string;
  seoDescription: string;
  introHtml: string;
  bgImageUrl: string | null;
  bgColeccionSlug: string | null;
  stats: { pueblosTotal: number; coleccionesTotal: number };
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

async function getIntro(locale: string): Promise<Intro | null> {
  const API_BASE = getApiUrl();
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/public/descubre/intro?lang=${encodeURIComponent(locale)}`,
      { cache: "no-store", timeoutMs: 8000 },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const path = "/descubre";
  const intro = await getIntro(locale);
  const title = intro?.seoTitle ?? "Pueblos con encanto de España: castillos, mar, montaña | Colecciones temáticas";
  const description =
    intro?.seoDescription ??
    "Encuentra los pueblos más bonitos de España por temáticas: castillos, costa, alta montaña, amurallados, pequeños, de piedra, en familia. Rankings actualizados por valoraciones reales.";

  const finalOgImage = intro?.bgImageUrl ?? `${getBaseUrl()}/brand/logo-lpbe-1.png`;

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

const HERO_LABELS: Record<string, { breadcrumb: string; readMore: string; readLess: string }> = {
  es: { breadcrumb: "Descubre", readMore: "Leer más", readLess: "Mostrar menos" },
  en: { breadcrumb: "Discover", readMore: "Read more", readLess: "Show less" },
  fr: { breadcrumb: "Découvrir", readMore: "Lire plus", readLess: "Afficher moins" },
  de: { breadcrumb: "Entdecken", readMore: "Mehr lesen", readLess: "Weniger anzeigen" },
  pt: { breadcrumb: "Descobrir", readMore: "Ler mais", readLess: "Mostrar menos" },
  it: { breadcrumb: "Scopri", readMore: "Leggi di più", readLess: "Mostra meno" },
  ca: { breadcrumb: "Descobreix", readMore: "Llegir més", readLess: "Mostrar menys" },
};

export default async function DescubrePage() {
  const locale = await getLocale();
  const [collections, intro] = await Promise.all([
    getCollections(locale),
    getIntro(locale),
  ]);
  const labels = HERO_LABELS[locale] ?? HERO_LABELS.es;

  const base = getBaseUrl();
  const pageUrl = getCanonicalUrl("/descubre", locale as SupportedLocale);
  const title = intro?.seoTitle ?? "Pueblos con encanto de España";
  const description = intro?.seoDescription ?? "";
  const firstCoverCollection = collections.find((c) => c?.imageUrl) ?? null;
  const heroBgImage = intro?.bgImageUrl ?? firstCoverCollection?.imageUrl ?? null;
  const h1 = intro?.h1 ?? "Pueblos con encanto de España por temáticas";
  const sub =
    intro?.sub ??
    "Castillos, costa, alta montaña, pueblos amurallados, pequeños, de piedra, en familia… Rankings y colecciones temáticas de los pueblos más bonitos certificados.";

  const collectionLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: pageUrl,
    inLanguage: locale,
    ...(heroBgImage ? { image: heroBgImage } : {}),
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
      { "@type": "ListItem", position: 2, name: labels.breadcrumb, item: pageUrl },
    ],
  };

  return (
    <main className="min-h-screen">
      <JsonLd data={collectionLd} />
      <JsonLd data={breadcrumbLd} />

      {/* Hero con imagen de fondo + overlay para legibilidad */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {heroBgImage ? (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${heroBgImage})` }}
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/70"
              aria-hidden
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#3d2c1e] via-[#5a3d28] to-[#4a6741]" aria-hidden />
        )}
        <div className="absolute inset-0 bg-[url('/brand/pattern-subtle.svg')] opacity-5" aria-hidden />

        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <h1 className="font-serif text-4xl font-bold text-white drop-shadow-lg md:text-6xl tracking-tight">
            {h1}
          </h1>
          <p className="mt-5 text-lg text-white/95 drop-shadow md:text-xl max-w-3xl mx-auto leading-relaxed">
            {sub}
          </p>
          {intro?.stats ? (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-white/95">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                <span className="text-base font-bold">{intro.stats.pueblosTotal}</span>
                pueblos certificados
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                <span className="text-base font-bold">{intro.stats.coleccionesTotal}</span>
                colecciones temáticas
              </span>
            </div>
          ) : null}
        </div>
      </section>

      {intro?.introHtml ? (
        <DescubreIntroBlock html={intro.introHtml} readMoreLabel={labels.readMore} readLessLabel={labels.readLess} />
      ) : null}

      <DescubreGrid collections={collections} locale={locale} />
    </main>
  );
}
