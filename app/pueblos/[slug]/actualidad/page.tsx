import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import ActualidadPuebloClient from './ActualidadPuebloClient';
import { getPuebloBySlug } from '@/lib/api';
import { getCanonicalUrl, getLocaleAlternates, seoTitle, seoDescription, type SupportedLocale } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);
  const safeSlug = pueblo?.slug ?? slug;
  const safeName = pueblo?.nombre ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const path = `/pueblos/${safeSlug}/actualidad`;
  if (!pueblo) {
    return {
      title: seoTitle(`Actualidad de ${safeName}`),
      description: seoDescription(`Noticias, eventos y novedades de ${safeName}.`),
      alternates: {
        canonical: getCanonicalUrl(path, locale as SupportedLocale),
        languages: getLocaleAlternates(path),
      },
      robots: { index: true, follow: true },
    };
  }

  const canonicalPath = `/pueblos/${pueblo.slug}/actualidad`;
  return {
    title: seoTitle(`Actualidad de ${pueblo.nombre}`),
    description: seoDescription(`Noticias, eventos y novedades de ${pueblo.nombre}.`),
    alternates: {
      canonical: getCanonicalUrl(canonicalPath, locale as SupportedLocale),
      languages: getLocaleAlternates(canonicalPath),
    },
  };
}

export default async function ActualidadPuebloPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tipo?: string; modo?: string }>;
}) {
  const { slug } = await params;
  const { tipo, modo } = await searchParams;
  const locale = await getLocale();
  const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);

  if (!pueblo) {
    permanentRedirect('/pueblos');
  }

  return (
    <ActualidadPuebloClient
      puebloId={pueblo.id}
      puebloNombre={pueblo.nombre}
      puebloSlug={pueblo.slug}
      tipo={tipo}
      modo={modo}
    />
  );
}
