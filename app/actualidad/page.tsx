'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

type Contenido = {
  id: number;
  titulo: string;
  slug: string;
  resumen?: string;
  coverUrl?: string;
  tipo: string;
  publishedAt?: string;
  createdAt?: string;
};

const TIPOS = [
  { key: 'TODOS', label: 'Todos' },
  { key: 'NOTICIA', label: 'Noticias' },
  { key: 'EVENTO', label: 'Eventos' },
  { key: 'ARTICULO', label: 'Artículos' },
];

function ActualidadContent() {
  const searchParams = useSearchParams();
  const tipoParam = searchParams.get('tipo') ?? 'TODOS';
  
  const [items, setItems] = useState<Contenido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (tipoParam !== 'TODOS') params.set('tipo', tipoParam);
        params.set('limit', '50');
        
        const queryString = params.toString() ? `?${params.toString()}` : '';
        const res = await fetch(`/api/public/contenidos${queryString}`, {
          cache: 'no-store',
        });

        if (!res.ok) throw new Error('Error cargando contenidos');

        const json = await res.json();
        const data = Array.isArray(json) ? json : (json?.items ?? []);
        
        if (!cancelled) {
          setItems(data);
        }
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tipoParam]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold">Actualidad</h1>
        <p className="mt-2 text-gray-600">
          Noticias, eventos y artículos de Los Pueblos Más Bonitos de España
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TIPOS.map((t) => (
          <Link
            key={t.key}
            href={t.key === 'TODOS' ? '/actualidad' : `/actualidad?tipo=${t.key}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tipoParam === t.key
                ? 'bg-black text-white'
                : 'bg-black/5 text-black hover:bg-black/10'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-600">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="rounded-md border p-6 text-gray-600">
          No hay contenido disponible.
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => {
            const href = `/c/${item.slug}`;
            const fecha = item.publishedAt ?? item.createdAt;
            const fechaFormateada = fecha
              ? new Date(fecha).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : '';

            return (
              <article key={item.id} className="border-b pb-6 last:border-0">
                <Link href={href} className="group block">
                  {item.coverUrl && (
                    <div className="mb-4 overflow-hidden rounded-lg">
                      <img
                        src={item.coverUrl}
                        alt={item.titulo}
                        className="h-64 w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {item.tipo}
                    </span>
                    {fechaFormateada && (
                      <>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-500">{fechaFormateada}</span>
                      </>
                    )}
                  </div>

                  <h2 className="text-2xl font-semibold group-hover:underline">
                    {item.titulo}
                  </h2>

                  {item.resumen && (
                    <p className="mt-3 text-gray-700 line-clamp-2">{item.resumen}</p>
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

export default function ActualidadPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-6 py-10 text-gray-600">Cargando...</div>}>
      <ActualidadContent />
    </Suspense>
  );
}
