import Link from 'next/link';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Noticia = {
  id: number;
  titulo: string;
  contenido?: string;
  coverUrl?: string;
  slug?: string;
  fecha?: string;
  createdAt?: string;
};

async function fetchNoticias(): Promise<Noticia[]> {
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(`${baseUrl}/api/public/noticias?limit=20`, {
    cache: 'no-store',
  });

  if (!res.ok) return [];
  const json = await res.json();
  const items = Array.isArray(json) ? json : (json?.items ?? []);
  return items;
}

export default async function NoticiasPublicPage() {
  const noticias = await fetchNoticias();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold">Noticias</h1>
        <p className="mt-2 text-gray-600">
          Actualidad de la Asociación Los Pueblos Más Bonitos de España
        </p>
      </div>

      {noticias.length === 0 ? (
        <div className="rounded-md border p-6 text-gray-600">
          No hay noticias disponibles.
        </div>
      ) : (
        <div className="space-y-6">
          {noticias.map((noticia) => {
            const href = noticia.slug 
              ? `/noticias/${noticia.slug}` 
              : `/noticias/${noticia.id}`;
            
            const fecha = noticia.fecha ?? noticia.createdAt;
            const fechaFormateada = fecha 
              ? new Date(fecha).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })
              : '';

            return (
              <article key={noticia.id} className="border-b pb-6 last:border-0">
                <Link href={href} className="group block">
                  {noticia.coverUrl && (
                    <div className="mb-4 overflow-hidden rounded-lg">
                      <img
                        src={noticia.coverUrl}
                        alt={noticia.titulo}
                        className="h-64 w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                  )}
                  
                  <h2 className="text-2xl font-semibold group-hover:underline">
                    {noticia.titulo}
                  </h2>
                  
                  {fechaFormateada && (
                    <p className="mt-1 text-sm text-gray-500">{fechaFormateada}</p>
                  )}
                  
                  {noticia.contenido && (
                    <p className="mt-3 text-gray-700 line-clamp-3">
                      {noticia.contenido}
                    </p>
                  )}
                  
                  <span className="mt-3 inline-block text-sm font-medium text-blue-600 group-hover:underline">
                    Leer más →
                  </span>
                </Link>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-10">
        <Link href="/" className="text-sm hover:underline">
          ← Volver al inicio
        </Link>
      </div>
    </main>
  );
}
