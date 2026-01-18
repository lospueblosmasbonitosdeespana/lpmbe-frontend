import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import ActualidadPuebloClient from './ActualidadPuebloClient';

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

export default async function ActualidadPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pueblo = await fetchPueblo(slug);

  if (!pueblo) {
    notFound();
  }

  return (
    <ActualidadPuebloClient
      puebloId={pueblo.id}
      puebloNombre={pueblo.nombre}
      puebloSlug={pueblo.slug}
    />
  );
}
