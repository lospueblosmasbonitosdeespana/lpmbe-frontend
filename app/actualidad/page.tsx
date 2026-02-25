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
  _source: 'contenido' | 'notificacion';
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
        
        // Buscar en AMBAS tablas: Contenido (/contenidos) y Notificacion (/noticias, /eventos)
        // Los contenidos van a /c/[slug], las notificaciones a /noticias/[slug] o /eventos/[slug]
        const fetches: { url: string; tipo: string; source: 'contenido' | 'notificacion' }[] = [];

        if (tipoParam === 'TODOS' || tipoParam === 'NOTICIA') {
          fetches.push({ url: '/api/public/contenidos?scope=ASOCIACION&tipo=NOTICIA&limit=50', tipo: 'NOTICIA', source: 'contenido' });
          fetches.push({ url: '/api/public/noticias?limit=50', tipo: 'NOTICIA', source: 'notificacion' });
        }
        if (tipoParam === 'TODOS' || tipoParam === 'EVENTO') {
          fetches.push({ url: '/api/public/contenidos?scope=ASOCIACION&tipo=EVENTO&limit=50', tipo: 'EVENTO', source: 'contenido' });
          fetches.push({ url: '/api/public/eventos?limit=50', tipo: 'EVENTO', source: 'notificacion' });
        }
        if (tipoParam === 'TODOS' || tipoParam === 'ARTICULO') {
          fetches.push({ url: '/api/public/contenidos?scope=ASOCIACION&tipo=ARTICULO&limit=50', tipo: 'ARTICULO', source: 'contenido' });
        }

        const responses = await Promise.all(fetches.map(f => fetch(f.url, { cache: 'no-store' }).then(r => ({ r, tipo: f.tipo, source: f.source }))));
        const allItems: Contenido[] = [];
        const seenSlugs = new Set<string>();

        // Priorizar contenidos (tienen contenido completo) sobre notificaciones
        const sorted = [...responses].sort((a, b) => (a.source === 'contenido' ? -1 : 1) - (b.source === 'contenido' ? -1 : 1));

        for (const { r, tipo, source } of sorted) {
          if (!r.ok) continue;
          const json = await r.json().catch(() => []);
          const arr = Array.isArray(json) ? json : (json?.items ?? []);
          for (const item of arr) {
            const slug = item.slug ?? null;
            const dedupeKey = slug ?? `${source}-${item.id}`;
            if (seenSlugs.has(dedupeKey)) continue;
            seenSlugs.add(dedupeKey);
            allItems.push({
              id: item.id,
              titulo: item.titulo ?? '(sin título)',
              slug: slug ?? `_no-slug-${item.id}`,
              resumen: item.resumen ?? item.contenidoMd ?? item.contenido ?? undefined,
              coverUrl: item.coverUrl ?? undefined,
              tipo: (item.tipo ?? tipo).toUpperCase(),
              publishedAt: item.publishedAt ?? item.fechaInicio ?? undefined,
              createdAt: item.createdAt ?? undefined,
              _source: source,
            });
          }
        }

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
            let href: string;
            if (item.slug && !item.slug.startsWith('_no-slug-')) {
              if (item._source === 'contenido') {
                href = `/c/${item.slug}`;
              } else {
                const tipo = item.tipo.toUpperCase();
                if (tipo === 'NOTICIA') href = `/noticias/${item.slug}`;
                else if (tipo === 'EVENTO') href = `/eventos/${item.slug}`;
                else href = `/c/${item.slug}`;
              }
            } else {
              href = '/actualidad';
            }
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
