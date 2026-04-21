import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import { getTranslations, getLocale } from 'next-intl/server';
import {
  getCanonicalUrl,
  getDefaultOgImage,
  getLocaleAlternates,
  getOGLocale,
  seoTitle,
  seoDescription,
  slugToTitle,
  type SupportedLocale,
} from '@/lib/seo';
import PuebloContent, { type NRPuebloDetail, type NRConfig } from '../PuebloContent';

export const revalidate = 60;

type Payload = {
  participa: true;
  anio: number;
  esEdicionActiva: boolean;
} & NRPuebloDetail;

const fetchData = cache(
  async (slug: string, anio: number, lang?: string): Promise<Payload | null> => {
    try {
      const API_BASE = getApiUrl();
      const langParam = lang && lang !== 'es' ? `?lang=${lang}` : '';
      const res = await fetch(`${API_BASE}/noche-romantica/pueblos/${slug}/${anio}${langParam}`);
      if (!res.ok) return null;
      return (await res.json()) as Payload;
    } catch {
      return null;
    }
  },
);

async function fetchNRConfig(): Promise<NRConfig> {
  try {
    const API_BASE = getApiUrl();
    const res = await fetch(`${API_BASE}/noche-romantica/app-status`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

function parseAnio(raw: string): number | null {
  if (!/^\d{4}$/.test(raw)) return null;
  const n = parseInt(raw, 10);
  if (n < 2000 || n > 2100) return null;
  return n;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ puebloSlug: string; anio: string }>;
}): Promise<Metadata> {
  const { puebloSlug, anio: anioRaw } = await params;
  const anio = parseAnio(anioRaw);
  if (!anio) return { robots: { index: false, follow: false } };
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations('seo');
  const data = await fetchData(puebloSlug, anio, locale);
  const name = data?.pueblo?.nombre || slugToTitle(puebloSlug);
  const path = `/noche-romantica/pueblos-participantes/${puebloSlug}/${anio}`;
  const shortPath = `/noche-romantica/pueblos-participantes/${puebloSlug}`;

  if (!data) {
    return {
      title: seoTitle(`La Noche Romántica ${anio} en ${name}`),
      robots: { index: false, follow: true },
      alternates: { canonical: getCanonicalUrl(shortPath, locale) },
    };
  }

  const title = seoTitle(
    tSeo.has('nocheRomanticaAnioTitle')
      ? tSeo('nocheRomanticaAnioTitle', { nombre: name, anio })
      : `La Noche Romántica ${anio} en ${name}`,
  );
  const description = seoDescription(
    data.descripcion?.trim() ||
      (tSeo.has('nocheRomanticaAnioDesc')
        ? tSeo('nocheRomanticaAnioDesc', { nombre: name, anio })
        : `Actividades y programa de La Noche Romántica ${anio} en ${name}.`),
  );
  const ogImage =
    data.cartelUrl?.trim() || data.pueblo.foto_destacada?.trim() || getDefaultOgImage();

  const isActive = data.esEdicionActiva;
  const canonical = getCanonicalUrl(isActive ? shortPath : path, locale);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: getLocaleAlternates(isActive ? shortPath : path),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: getOGLocale(locale),
      type: 'article',
      images: [{ url: ogImage, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: { index: !isActive, follow: true },
  };
}

export default async function NocheRomanticaPuebloAnioPage({
  params,
}: {
  params: Promise<{ puebloSlug: string; anio: string }>;
}) {
  const { puebloSlug, anio: anioRaw } = await params;
  const anio = parseAnio(anioRaw);
  if (!anio) notFound();
  const locale = await getLocale();
  const [data, nrConfig] = await Promise.all([
    fetchData(puebloSlug, anio, locale),
    fetchNRConfig(),
  ]);
  if (!data) notFound();

  return (
    <main className="min-h-screen">
      {!data.esEdicionActiva && (
        <div className="border-b border-amber-300/60 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          Estás viendo el archivo de <strong>La Noche Romántica {anio}</strong>. Es un
          snapshot histórico; la información no se actualiza.
        </div>
      )}
      <PuebloContent
        data={data}
        nrConfig={nrConfig}
        anio={anio}
        showArchivedBadge={!data.esEdicionActiva}
      />
    </main>
  );
}
