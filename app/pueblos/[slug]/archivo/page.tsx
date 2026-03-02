import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ArchivoPuebloClient from './ArchivoPuebloClient';

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
    return { title: 'Archivo no encontrado | Los Pueblos Más Bonitos de España' };
  }

  return {
    title: `Noticias y eventos anteriores de ${pueblo.nombre} | Los Pueblos Más Bonitos de España`,
    description: `Archivo de noticias y eventos pasados de ${pueblo.nombre}. Consulta el historial de actividades y acontecimientos del pueblo.`,
    openGraph: {
      title: `Noticias y eventos anteriores de ${pueblo.nombre}`,
      description: `Archivo de noticias y eventos pasados de ${pueblo.nombre}.`,
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
