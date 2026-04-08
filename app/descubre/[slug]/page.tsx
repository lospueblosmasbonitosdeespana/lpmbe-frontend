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
  return {
    title: { absolute: data.seoTitle },
    description: data.seoDescription,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title: data.seoTitle,
      description: data.seoDescription,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
    },
  };
}

export default async function DescubreSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const data = await getCollection(slug, locale);

  if (!data) notFound();

  const baseUrl = getBaseUrl();
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: data.seoTitle,
    description: data.seoDescription,
    numberOfItems: data.count,
    itemListElement: data.pueblos.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.nombre,
      url: `${baseUrl}/pueblos/${p.slug}`,
    })),
  };

  return (
    <main className="min-h-screen">
      <JsonLd data={itemListLd} />
      <CollectionView data={data} locale={locale} />
    </main>
  );
}
