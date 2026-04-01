import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import ArchivoPuebloClient from './ArchivoPuebloClient';
import {
  seoTitle,
  seoDescription,
  getCanonicalUrl,
  getLocaleAlternates,
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
  const path = `/pueblos/${slug}/archivo`;
  const title = seoTitle(`Noticias y eventos anteriores de ${pueblo.nombre}`);
  const description = seoDescription(`Archivo de noticias y eventos pasados de ${pueblo.nombre}. Consulta el historial de actividades y acontecimientos del pueblo.`);
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description: seoDescription(`Archivo de noticias y eventos pasados de ${pueblo.nombre}.`, 155),
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
