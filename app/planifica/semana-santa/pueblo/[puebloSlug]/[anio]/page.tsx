import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { getApiUrl } from '@/lib/api';
import { getLocale, getTranslations } from 'next-intl/server';
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
import EdicionView, { type Participante, type EdicionConfig } from '../EdicionView';

export const revalidate = 60;

type EdicionData = {
  participa: true;
  anio: number;
  esEdicionActiva: boolean;
  participante: Participante;
  config: EdicionConfig;
};

const fetchData = cache(
  async (slug: string, anio: number, locale: string): Promise<EdicionData | null> => {
    const API = getApiUrl();
    const lang = encodeURIComponent(locale);
    try {
      const res = await fetch(`${API}/semana-santa/pueblos/${slug}/${anio}?lang=${lang}`);
      if (!res.ok) return null;
      return (await res.json()) as EdicionData;
    } catch {
      return null;
    }
  },
);

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
  if (!anio) {
    return { robots: { index: false, follow: false } };
  }
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations('seo');
  const data = await fetchData(puebloSlug, anio, locale);
  const name = data?.participante?.pueblo?.nombre || slugToTitle(puebloSlug);
  const path = `/planifica/semana-santa/pueblo/${puebloSlug}/${anio}`;
  const shortPath = `/planifica/semana-santa/pueblo/${puebloSlug}`;

  if (!data) {
    return {
      title: seoTitle(`Semana Santa ${anio} en ${name}`),
      robots: { index: false, follow: true },
      alternates: { canonical: getCanonicalUrl(shortPath, locale) },
    };
  }

  const title = seoTitle(
    tSeo.has('semanaSantaAnioTitle')
      ? tSeo('semanaSantaAnioTitle', { nombre: name, anio })
      : `Semana Santa ${anio} en ${name}`,
  );
  const description = seoDescription(
    data.participante.descripcion?.trim() ||
      (tSeo.has('semanaSantaAnioDesc')
        ? tSeo('semanaSantaAnioDesc', { nombre: name, anio })
        : `Procesiones, cofradías y agenda de la Semana Santa ${anio} en ${name}.`),
  );
  const ogImage =
    data.participante.cartelHorizontalUrl?.trim() ||
    data.participante.pueblo.foto_destacada?.trim() ||
    data.participante.cartelVerticalUrl?.trim() ||
    getDefaultOgImage();

  // Si es edición activa: canonical apunta a la URL corta (evitar duplicación)
  // y NO indexar esta URL con año (la corta es la canónica).
  // Si es edición pasada (archivo): canonical a sí misma, indexable.
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

export default async function SemanaSantaPuebloAnioPage({
  params,
}: {
  params: Promise<{ puebloSlug: string; anio: string }>;
}) {
  const { puebloSlug, anio: anioRaw } = await params;
  const anio = parseAnio(anioRaw);
  if (!anio) notFound();
  const locale = await getLocale();
  const data = await fetchData(puebloSlug, anio, locale);
  if (!data) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-background to-background">
      <EdicionView
        participante={data.participante}
        config={data.config}
        locale={locale}
        anio={anio}
        showArchivedBadge={!data.esEdicionActiva}
      />
    </main>
  );
}
