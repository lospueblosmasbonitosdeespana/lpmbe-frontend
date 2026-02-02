'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { formatEventoRangeEs, formatDateTimeEs } from '@/app/_lib/dates';

type Contenido = {
  id: number;
  titulo: string;
  slug: string;
  resumen?: string;
  coverUrl?: string;
  tipo: string;
  publishedAt?: string;
  createdAt?: string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
};

type ActualidadPuebloClientProps = {
  puebloId: number;
  puebloNombre: string;
  puebloSlug: string;
};

function procesarContenidos(contenidos: Contenido[]): Contenido[] {
  const ahora = new Date();

  const eventos = contenidos.filter((c) => c.tipo === 'EVENTO');
  const noticias = contenidos.filter((c) => c.tipo === 'NOTICIA');
  const articulos = contenidos.filter((c) => c.tipo === 'ARTICULO');
  const paginas = contenidos.filter((c) => c.tipo === 'PAGINA');

  // Eventos: solo próximos, ordenar por fechaInicio ascendente
  const eventosProximos = eventos
    .filter((e) => {
      if (!e.fechaInicio) return false;
      return new Date(e.fechaInicio) >= ahora;
    })
    .sort((a, b) => {
      if (!a.fechaInicio || !b.fechaInicio) return 0;
      return new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime();
    });

  // Noticias: por publishedAt descendente (más recientes primero)
  const noticiasOrdenadas = [...noticias].sort((a, b) => {
    const pa = a.publishedAt ?? a.createdAt ?? '';
    const pb = b.publishedAt ?? b.createdAt ?? '';
    if (!pa || !pb) return 0;
    return new Date(pb).getTime() - new Date(pa).getTime();
  });

  // Artículos: por publishedAt descendente
  const articulosOrdenados = [...articulos].sort((a, b) => {
    const pa = a.publishedAt ?? a.createdAt ?? '';
    const pb = b.publishedAt ?? b.createdAt ?? '';
    if (!pa || !pb) return 0;
    return new Date(pb).getTime() - new Date(pa).getTime();
  });

  // Páginas: por publishedAt descendente
  const paginasOrdenadas = [...paginas].sort((a, b) => {
    const pa = a.publishedAt ?? a.createdAt ?? '';
    const pb = b.publishedAt ?? b.createdAt ?? '';
    if (!pa || !pb) return 0;
    return new Date(pb).getTime() - new Date(pa).getTime();
  });

  return [
    ...noticiasOrdenadas,
    ...eventosProximos,
    ...articulosOrdenados,
    ...paginasOrdenadas,
  ];
}

const TIPO_LABEL: Record<string, string> = {
  EVENTO: 'Evento',
  NOTICIA: 'Noticia',
  ARTICULO: 'Artículo',
  PAGINA: 'Página temática',
};

export default function ActualidadPuebloClient({ puebloId, puebloNombre, puebloSlug }: ActualidadPuebloClientProps) {
  const [items, setItems] = useState<Contenido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/contenidos?puebloId=${puebloId}&limit=50`, {
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
  }, [puebloId]);

  const itemsProcesados = useMemo(() => procesarContenidos(items), [items]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold">Actualidad · {puebloNombre}</h1>
        <p className="mt-2 text-gray-600">
          Noticias, eventos y artículos de {puebloNombre}
        </p>
      </div>

      {loading ? (
        <div className="text-gray-600">Cargando...</div>
      ) : itemsProcesados.length === 0 ? (
        <div className="rounded-md border p-6 text-gray-600">
          No hay contenido disponible.
        </div>
      ) : (
        <div className="space-y-6">
          {itemsProcesados.map((item) => {
            const href = `/c/${item.slug}`;
            const esEvento = item.tipo === 'EVENTO';
            const fechaPub = item.publishedAt ?? item.createdAt;
            const fechaFormateada = esEvento && item.fechaInicio
              ? formatEventoRangeEs(item.fechaInicio, item.fechaFin ?? undefined)
              : fechaPub
                ? formatDateTimeEs(fechaPub)
                : '';

            return (
              <article key={item.id} className="border-b pb-6 last:border-0">
                <Link href={href} className="group block">
                  {item.coverUrl && item.coverUrl.trim() && (
                    <div className="mb-4 overflow-hidden rounded-lg">
                      <img
                        src={item.coverUrl.trim()}
                        alt={item.titulo}
                        className="h-64 w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {TIPO_LABEL[item.tipo] ?? item.tipo}
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
        <Link href={`/pueblos/${puebloSlug}`} className="text-sm hover:underline">
          ← Volver al pueblo
        </Link>
      </div>
    </main>
  );
}
