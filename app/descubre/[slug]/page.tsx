import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getApiUrl } from "@/lib/api";
import { fetchWithTimeout } from "@/lib/fetch-safe";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  getBaseUrl,
  type SupportedLocale,
} from "@/lib/seo";
import { CollectionView } from "./CollectionView";
import JsonLd from "@/app/components/seo/JsonLd";

export const dynamic = "force-dynamic";

type CollectionData = {
  slug: string;
  type: string;
  icon: string;
  color: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  imageUrl: string | null;
  pueblos: Array<{
    id: number;
    slug: string;
    nombre: string;
    provincia: string;
    comunidad: string;
    lat: number;
    lng: number;
    foto_destacada: string | null;
    highlightExtra?: string | null;
    habitantes?: string | null;
    linkUrl?: string | null;
    linkedName?: string | null;
    detalle?: string | null;
    visitable?: boolean | null;
    meteo?: {
      temperatureC: number | null;
      weatherCode: number | null;
      snowfallMm?: number | null;
    } | null;
  }>;
  count: number;
  generatedAt: string;
};

async function getCollection(slug: string, locale: string): Promise<CollectionData | null> {
  const API_BASE = getApiUrl();
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/public/descubre/${encodeURIComponent(slug)}?lang=${encodeURIComponent(locale)}`,
      { next: { revalidate: 60 }, timeoutMs: 15000 },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.error) return null;
    return data;
  } catch {
    return null;
  }
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const data = await getCollection(slug, locale);
  if (!data) return { title: "Not found" };

  const path = `/descubre/${slug}`;
  const ogImages = data.imageUrl ? [{ url: data.imageUrl }] : undefined;
  return {
    title: { absolute: data.seoTitle },
    description: data.seoDescription,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: data.seoTitle,
      description: data.seoDescription,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
      type: "website",
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: ogImages ? "summary_large_image" : "summary",
      title: data.seoTitle,
      description: data.seoDescription,
      ...(data.imageUrl ? { images: [data.imageUrl] } : {}),
    },
  };
}

export default async function DescubreSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const data = await getCollection(slug, locale);

  if (!data) notFound();

  const baseUrl = getBaseUrl();
  const pageUrl = `${baseUrl}/descubre/${data.slug}`;

  const collectionLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: data.seoTitle,
    description: data.seoDescription,
    url: pageUrl,
    ...(data.imageUrl ? { image: data.imageUrl } : {}),
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      name: "Los Pueblos Más Bonitos de España",
      url: baseUrl,
    },
    mainEntity: {
      "@type": "ItemList",
      name: data.seoTitle,
      numberOfItems: data.count,
      itemListElement: data.pueblos.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${baseUrl}/pueblos/${p.slug}`,
        item: {
          "@type": "TouristAttraction",
          name: p.nombre,
          url: `${baseUrl}/pueblos/${p.slug}`,
          ...(p.foto_destacada ? { image: p.foto_destacada } : {}),
          address: {
            "@type": "PostalAddress",
            addressLocality: p.nombre,
            addressRegion: p.provincia,
            addressCountry: "ES",
          },
          ...(p.lat && p.lng
            ? {
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: p.lat,
                  longitude: p.lng,
                },
              }
            : {}),
        },
      })),
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: `${baseUrl}/` },
      { "@type": "ListItem", position: 2, name: "Descubre", item: `${baseUrl}/descubre` },
      { "@type": "ListItem", position: 3, name: data.title, item: pageUrl },
    ],
  };

  return (
    <main className="min-h-screen">
      <JsonLd data={collectionLd} />
      <JsonLd data={breadcrumbLd} />
      <CollectionView data={data} locale={locale} />
    </main>
  );
}
