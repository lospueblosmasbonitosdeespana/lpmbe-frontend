import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Contenido = {
  id: number;
  titulo: string;
  slug: string;
  resumen?: string;
  contenidoMd?: string;
  coverUrl?: string;
  tipo: string;
  estado: string;
  publishedAt?: string;
  createdAt?: string;
};

async function fetchContenido(slug: string): Promise<Contenido | null> {
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(`${baseUrl}/api/public/contenidos/${slug}`, {
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
  const contenido = await fetchContenido(slug);

  if (!contenido) {
    return {
      title: 'Contenido no encontrado | Los Pueblos Más Bonitos de España',
    };
  }

  // Generar descripción: resumen o primeros 160 chars del markdown
  let description = contenido.resumen ?? '';
  if (!description && contenido.contenidoMd) {
    const plainText = contenido.contenidoMd
      .replace(/[#*\[\]()]/g, '') // Quitar símbolos markdown
      .replace(/\n+/g, ' ')
      .trim();
    description = plainText.slice(0, 160);
    if (plainText.length > 160) description += '...';
  }

  return {
    title: `${contenido.titulo} | Los Pueblos Más Bonitos de España`,
    description: description || undefined,
    openGraph: {
      title: contenido.titulo,
      description: description || undefined,
      images: contenido.coverUrl ? [{ url: contenido.coverUrl }] : [],
    },
  };
}

export default async function ContenidoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const contenido = await fetchContenido(slug);

  if (!contenido) {
    notFound();
  }

  const fecha = contenido.publishedAt ?? contenido.createdAt;
  const fechaFormateada = fecha
    ? new Date(fecha).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <article>
        {contenido.coverUrl && (
          <div className="mb-8 overflow-hidden rounded-lg">
            <img
              src={contenido.coverUrl}
              alt={contenido.titulo}
              className="w-full h-auto"
            />
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-4xl font-bold">{contenido.titulo}</h1>
          
          {fechaFormateada && (
            <p className="mt-2 text-sm text-gray-500">{fechaFormateada}</p>
          )}
          
          {contenido.resumen && (
            <p className="mt-4 text-lg text-gray-700">{contenido.resumen}</p>
          )}
        </header>

        {contenido.contenidoMd && (
          <div className="prose prose-lg max-w-none">
            <ReactMarkdown>{contenido.contenidoMd}</ReactMarkdown>
          </div>
        )}
      </article>

      <div className="mt-12 border-t pt-6">
        <Link href="/actualidad" className="text-sm hover:underline">
          ← Volver a actualidad
        </Link>
      </div>
    </main>
  );
}
