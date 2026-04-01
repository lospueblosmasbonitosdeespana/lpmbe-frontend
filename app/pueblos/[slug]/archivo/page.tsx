import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import ArchivoPuebloClient from './ArchivoPuebloClient';
import {
  seoTitle,
  seoDescription,
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  type SupportedLocale,
} from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
};

async function fetchPueblo(slug: string): Promise<Pueblo | null> {
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(`${baseUrl}/api/pueblos/${slug}`, {
    cache: 'no-store',
  });

  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pueblo = await fetchPueblo(slug);

  if (!pueblo) {
    return { title: 'Archivo no encontrado' };
  }

  const locale = await getLocale();
  const tSeo = await getTranslations('seo');
  const path = `/pueblos/${slug}/archivo`;
  const title = seoTitle(tSeo('archivoTitle', { nombre: pueblo.nombre }));
  const description = seoDescription(tSeo('archivoDesc', { nombre: pueblo.nombre }));
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      locale: getOGLocale(locale as SupportedLocale),
    },
  };
}

export default async function ArchivoPuebloPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { slug } = await params;
  const { tipo } = await searchParams;
  const pueblo = await fetchPueblo(slug);

  if (!pueblo) {
    notFound();
  }

  return (
    <ArchivoPuebloClient
      puebloId={pueblo.id}
      puebloNombre={pueblo.nombre}
      puebloSlug={pueblo.slug}
      tipo={tipo}
    />
  );
}
