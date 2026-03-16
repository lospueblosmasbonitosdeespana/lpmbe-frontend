import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import ActualidadPuebloClient from './ActualidadPuebloClient';
import { getPuebloBySlug } from '@/lib/api';
import { getCanonicalUrl, getLocaleAlternates, type SupportedLocale } from '@/lib/seo';

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
  if (!pueblo) return { title: 'Actualidad | Los Pueblos Más Bonitos de España' };

  const path = `/pueblos/${pueblo.slug}/actualidad`;
  return {
    title: `Actualidad de ${pueblo.nombre} | Los Pueblos Más Bonitos de España`,
    description: `Noticias, eventos y novedades de ${pueblo.nombre}.`,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
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
    notFound();
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
