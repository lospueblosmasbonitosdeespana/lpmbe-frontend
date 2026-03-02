'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import ShareButton from '@/app/components/ShareButton';
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

type ArchivoPuebloClientProps = {
  puebloId: number;
  puebloNombre: string;
  puebloSlug: string;
  tipo?: string;
};

const TIPO_LABEL: Record<string, string> = {
  EVENTO: 'Evento',
  NOTICIA: 'Noticia',
};

const PAGE_SIZE = 20;

function TarjetaContenido({ item }: { item: Contenido }) {
  const href = `/c/${item.slug}`;
  const esEvento = item.tipo === 'EVENTO';
  const fechaPub = item.publishedAt ?? item.createdAt;
  const fechaFormateada =
    esEvento && item.fechaInicio
      ? formatEventoRangeEs(item.fechaInicio, item.fechaFin ?? undefined)
      : fechaPub
        ? formatDateTimeEs(fechaPub)
        : '';

  const eventoPasado =
    esEvento &&
    item.fechaFin &&
    new Date(item.fechaFin) < new Date();

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white overflow-hidden transition hover:border-gray-300 hover:shadow-md">
      <Link href={href} className="group block">
        {item.coverUrl && item.coverUrl.trim() ? (
          <div className="aspect-[16/10] overflow-hidden relative">
            <img
              src={item.coverUrl.trim()}
              alt={item.titulo}
              className="w-full h-full object-cover transition group-hover:scale-105"
            />
            {eventoPasado && (
              <div className="absolute top-2 left-2 bg-gray-800/80 text-white text-xs px-2 py-1 rounded">
                Finalizado
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[16/10] bg-gray-100 flex items-center justify-center relative">
            <span className="text-gray-400 text-sm">Sin imagen</span>
            {eventoPasado && (
              <div className="absolute top-2 left-2 bg-gray-800/80 text-white text-xs px-2 py-1 rounded">
                Finalizado
              </div>
            )}
          </div>
        )}
        <div className="p-4">
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
          <h3 className="font-semibold text-lg leading-tight group-hover:underline line-clamp-2">
            {item.titulo}
          </h3>
          {item.resumen && (
            <p className="mt-2 text-gray-600 text-sm line-clamp-2">
              {item.resumen}
            </p>
          )}
          <span className="mt-3 inline-block text-sm font-medium text-blue-600 group-hover:underline">
            Leer más →
          </span>
        </div>
      </Link>
      <div className="absolute top-3 right-3 z-10">
        <ShareButton url={href} title={item.titulo} variant="icon" />
      </div>
    </div>
  );
}

export default function ArchivoPuebloClient({
  puebloId,
  puebloNombre,
  puebloSlug,
  tipo,
}: ArchivoPuebloClientProps) {
  const [items, setItems] = useState<Contenido[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filtro, setFiltro] = useState<string>(tipo ?? '');

  const fetchItems = useCallback(
    async (cursor?: number) => {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      if (filtro) params.set('tipo', filtro);
      if (cursor) params.set('cursor', String(cursor));

      const res = await fetch(
        `/api/public/pueblos/${puebloId}/archivo?${params.toString()}`,
        { cache: 'no-store' },
      );

      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : json?.items ?? [];
    },
    [puebloId, filtro],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchItems();
        if (!cancelled) {
          setItems(data);
          setHasMore(data.length >= PAGE_SIZE);
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
  }, [fetchItems]);

  async function loadMore() {
    if (loadingMore || !hasMore || items.length === 0) return;
    setLoadingMore(true);
    try {
      const lastId = items[items.length - 1].id;
      const more = await fetchItems(lastId);
      setItems((prev) => [...prev, ...more]);
      setHasMore(more.length >= PAGE_SIZE);
    } catch {
      /* ignore */
    } finally {
      setLoadingMore(false);
    }
  }

  const baseUrl = `/pueblos/${puebloSlug}`;
  const filtroLabel = filtro === 'EVENTO' ? 'eventos' : filtro === 'NOTICIA' ? 'noticias' : 'noticias y eventos';

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <Link
          href={`${baseUrl}/actualidad`}
          className="text-sm text-gray-600 hover:underline mb-4 inline-block"
        >
          ← Volver a Actualidad
        </Link>
        <h1 className="text-4xl font-semibold">
          Archivo · {puebloNombre}
        </h1>
        <p className="mt-2 text-gray-600">
          Historial de {filtroLabel} de {puebloNombre}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-8">
        {['', 'NOTICIA', 'EVENTO'].map((f) => {
          const label = f === '' ? 'Todo' : f === 'NOTICIA' ? 'Noticias' : 'Eventos';
          const isActive = filtro === f;
          return (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center text-gray-600 py-12">Cargando...</div>
      ) : items.length === 0 ? (
        <div className="rounded-md border p-6 text-gray-600">
          No hay {filtroLabel} anteriores disponibles.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <TarjetaContenido key={item.id} item={item} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
              >
                {loadingMore ? 'Cargando...' : 'Cargar más'}
              </button>
            </div>
          )}
        </>
      )}

      <div className="mt-10">
        <Link href={baseUrl} className="text-sm hover:underline">
          ← Volver al pueblo
        </Link>
      </div>
    </main>
  );
}
