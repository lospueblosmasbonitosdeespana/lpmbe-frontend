import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { getApiUrl } from '@/lib/api';
import {
  getBaseUrl,
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoDescription,
  seoTitle,
  type SupportedLocale,
} from '@/lib/seo';
import JsonLd from '@/app/components/seo/JsonLd';
import ActualidadClient from './ActualidadClient';

export const revalidate = 60;

const VALID_TIPOS = ['noticia', 'evento', 'articulo'] as const;
type Tipo = (typeof VALID_TIPOS)[number];

type ActualidadItem = {
  id: number;
  titulo: string;
  slug: string;
  coverUrl?: string | null;
  tipo?: string;
  publishedAt?: string | null;
  createdAt?: string | null;
  fechaInicio?: string | null;
  source: 'contenido' | 'noticia' | 'evento';
};

function normalizeTipo(value: string | string[] | undefined): Tipo | null {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  const lower = raw.toLowerCase();
  return (VALID_TIPOS as readonly string[]).includes(lower) ? (lower as Tipo) : null;
}

async function fetchActualidadItems(locale: string, tipoFilter: Tipo | null): Promise<ActualidadItem[]> {
  try {
    const base = getApiUrl();
    const langQs = `lang=${encodeURIComponent(locale)}`;
    const urls: { url: string; source: ActualidadItem['source']; tipoFallback?: string }[] = [];
    const wantAll = tipoFilter === null;

    if (wantAll || tipoFilter === 'noticia') {
      urls.push({ url: `${base}/public/contenidos?scope=ASOCIACION&tipo=NOTICIA&limit=30&${langQs}`, source: 'contenido', tipoFallback: 'NOTICIA' });
      urls.push({ url: `${base}/public/noticias?limit=30&${langQs}`, source: 'noticia', tipoFallback: 'NOTICIA' });
    }
    if (wantAll || tipoFilter === 'evento') {
      urls.push({ url: `${base}/public/contenidos?scope=ASOCIACION&tipo=EVENTO&limit=30&${langQs}`, source: 'contenido', tipoFallback: 'EVENTO' });
      urls.push({ url: `${base}/public/eventos?limit=30&${langQs}`, source: 'evento', tipoFallback: 'EVENTO' });
    }
    if (wantAll || tipoFilter === 'articulo') {
      urls.push({ url: `${base}/public/contenidos?scope=ASOCIACION&tipo=ARTICULO&limit=30&${langQs}`, source: 'contenido', tipoFallback: 'ARTICULO' });
    }

    const responses = await Promise.all(
      urls.map(async ({ url, source, tipoFallback }) => {
        try {
          const res = await fetch(url, { headers: { 'Accept-Language': locale }, cache: 'no-store' });
          if (!res.ok) return [] as ActualidadItem[];
          const json = await res.json();
          const arr = Array.isArray(json) ? json : json?.items ?? [];
          return arr.map((item: any) => ({
            id: Number(item?.id ?? 0),
            titulo: String(item?.titulo ?? ''),
            slug: String(item?.slug ?? ''),
            coverUrl: item?.coverUrl ?? null,
            tipo: String(item?.tipo ?? tipoFallback ?? '').toUpperCase(),
            publishedAt: item?.publishedAt ?? null,
            createdAt: item?.createdAt ?? null,
            fechaInicio: item?.fechaInicio ?? null,
            source,
          })) as ActualidadItem[];
        } catch {
          return [];
        }
      }),
    );
    const all = responses.flat().filter((x) => x.id && x.slug);
    const seen = new Set<string>();
    const deduped: ActualidadItem[] = [];
    for (const it of all) {
      const key = `${it.source}-${it.slug}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(it);
    }
    return deduped.sort((a, b) => {
      const ta = new Date(a.publishedAt ?? a.createdAt ?? 0).getTime();
      const tb = new Date(b.publishedAt ?? b.createdAt ?? 0).getTime();
      return tb - ta;
    });
  } catch {
    return [];
  }
}

function hrefForItem(item: ActualidadItem): string {
  if (item.source === 'contenido') return `/c/${item.slug}`;
  if (item.source === 'noticia') return `/noticias/${item.slug}`;
  return `/eventos/${item.slug}`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<{ tipo?: string | string[] }>;
}): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations('seo');
  const tActualidad = await getTranslations('actualidad');
  const sp = searchParams ? await searchParams : {};
  const tipoFilter = normalizeTipo(sp.tipo);

  const sectionBase = tSeo('actualidadTitle');
  const sectionDesc = tSeo('actualidadDescription');
  const tipoLabel =
    tipoFilter === 'noticia'
      ? tActualidad('news')
      : tipoFilter === 'evento'
        ? tActualidad('events')
        : tipoFilter === 'articulo'
          ? tActualidad('articles')
          : null;
  const title = seoTitle(tipoLabel ? `${tipoLabel} · ${sectionBase}` : sectionBase);
  const description = seoDescription(sectionDesc);

  // og:image = primera foto del listado (server-side)
  const items = await fetchActualidadItems(locale, tipoFilter);
  const firstCover = items.map((i) => i.coverUrl).find((c): c is string => Boolean(c)) ?? null;
  const ogImages = firstCover ? [{ url: firstCover }] : undefined;

  const basePath = '/actualidad';
  // Para filtros por tipo, el canonical apunta al filtro (preserva señal de indexabilidad independiente)
  const filterPath = tipoFilter ? `${basePath}?tipo=${tipoFilter}` : basePath;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(filterPath, locale),
      languages: getLocaleAlternates(basePath),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(filterPath, locale),
      locale: getOGLocale(locale),
      type: 'website',
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: ogImages ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(firstCover ? { images: [firstCover] } : {}),
    },
  };
}

export default async function ActualidadPage({
  searchParams,
}: {
  searchParams?: Promise<{ tipo?: string | string[] }>;
}) {
  const locale = await getLocale();
  const sp = searchParams ? await searchParams : {};
  const tipoFilter = normalizeTipo(sp.tipo);
  const items = await fetchActualidadItems(locale, tipoFilter);
  const base = getBaseUrl();
  const pageUrl = tipoFilter
    ? `${base}/actualidad?tipo=${tipoFilter}`
    : `${base}/actualidad`;

  const firstCover = items.map((i) => i.coverUrl).find((c): c is string => Boolean(c)) ?? null;

  const collectionLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Actualidad · Los Pueblos Más Bonitos de España',
    description: 'Noticias, eventos y artículos sobre los pueblos más bonitos de España.',
    url: pageUrl,
    inLanguage: locale,
    ...(firstCover ? { image: firstCover } : {}),
    isPartOf: {
      '@type': 'WebSite',
      name: 'Los Pueblos Más Bonitos de España',
      url: base,
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.slice(0, 50).map((it, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${base}${hrefForItem(it)}`,
        name: it.titulo,
        ...(it.coverUrl ? { image: it.coverUrl } : {}),
      })),
    },
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: base },
      { '@type': 'ListItem', position: 2, name: 'Actualidad', item: `${base}/actualidad` },
    ],
  };

  return (
    <>
      <JsonLd data={collectionLd} />
      <JsonLd data={breadcrumbLd} />
      <ActualidadClient />
    </>
  );
}
