'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import ShareButton from '@/app/components/ShareButton';

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

function ActualidadContent() {
  const t = useTranslations('actualidad');
  const searchParams = useSearchParams();
  const tipoParam = searchParams.get('tipo') ?? 'TODOS';
  const TIPOS = [
    { key: 'TODOS', label: t('all') },
    { key: 'NOTICIA', label: t('news') },
    { key: 'EVENTO', label: t('events') },
    { key: 'ARTICULO', label: t('articles') },
  ];
  
  const [items, setItems] = useState<Contenido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        
        if (tipoParam === 'ARTICULO') {
          // Artículos solo están en la tabla Contenido
          const res = await fetch('/api/public/contenidos?scope=ASOCIACION&tipo=ARTICULO&limit=50', { cache: 'no-store' });
          if (!res.ok) throw new Error('Error cargando contenidos');
          const json = await res.json();
          if (!cancelled) setItems(Array.isArray(json) ? json : (json?.items ?? []));
          return;
        }

        // Para TODOS, NOTICIA, EVENTO: combinar Contenidos + Noticias/Eventos directos
        const fetches: Promise<Response>[] = [];

        if (tipoParam === 'TODOS' || tipoParam === 'NOTICIA') {
          fetches.push(
            fetch('/api/public/contenidos?scope=ASOCIACION&tipo=NOTICIA&limit=50', { cache: 'no-store' }),
            fetch('/api/public/noticias?limit=50', { cache: 'no-store' }),
          );
        }
        if (tipoParam === 'TODOS' || tipoParam === 'EVENTO') {
          fetches.push(
            fetch('/api/public/contenidos?scope=ASOCIACION&tipo=EVENTO&limit=50', { cache: 'no-store' }),
            fetch('/api/public/eventos?limit=50', { cache: 'no-store' }),
          );
        }
        if (tipoParam === 'TODOS') {
          fetches.push(
            fetch('/api/public/contenidos?scope=ASOCIACION&tipo=ARTICULO&limit=50', { cache: 'no-store' }),
          );
        }

        const responses = await Promise.all(fetches);
        const allItems: Contenido[] = [];
        const seenIds = new Set<string>();

        for (const res of responses) {
          if (!res.ok) continue;
          const json = await res.json().catch(() => []);
          const arr = Array.isArray(json) ? json : (json?.items ?? []);
          for (const item of arr) {
            // Deduplicar por slug o id
            const key = item.slug ?? `id-${item.id}`;
            if (seenIds.has(key)) continue;
            seenIds.add(key);
            allItems.push({
              id: item.id,
              titulo: item.titulo ?? '(sin título)',
              slug: item.slug ?? item.contenidoSlug ?? `notif-${item.id}`,
              resumen: item.resumen ?? item.contenido ?? undefined,
              coverUrl: item.coverUrl ?? undefined,
              tipo: item.tipo ?? item._tipo ?? 'NOTICIA',
              publishedAt: item.publishedAt ?? item.fechaInicio ?? undefined,
              createdAt: item.createdAt ?? undefined,
            });
          }
        }

        // Ordenar por fecha desc
        allItems.sort((a, b) => {
          const da = new Date(a.publishedAt ?? a.createdAt ?? 0).getTime();
          const db = new Date(b.publishedAt ?? b.createdAt ?? 0).getTime();
          return db - da;
        });

        if (!cancelled) setItems(allItems.slice(0, 50));
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
        <h1 className="text-4xl font-semibold">{t('title')}</h1>
        <p className="mt-2 text-gray-600">
          {t('pageDesc')}
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
        <div className="text-gray-600">{t('loading')}</div>
      ) : items.length === 0 ? (
        <div className="rounded-md border p-6 text-gray-600">
          {t('noContent')}
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
                <div className="flex items-start justify-between gap-4">
                  <Link href={href} className="group flex-1 min-w-0">
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
                    {t('readMore')}
                  </span>
                </Link>
                  <ShareButton url={href} title={item.titulo} variant="icon" className="shrink-0 mt-1" />
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-10">
        <Link href="/" className="text-sm hover:underline">
          {t('backToHome')}
        </Link>
      </div>
    </main>
  );
}

export default function ActualidadPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-6 py-10 text-gray-600">...</div>}>
      <ActualidadContent />
    </Suspense>
  );
}
