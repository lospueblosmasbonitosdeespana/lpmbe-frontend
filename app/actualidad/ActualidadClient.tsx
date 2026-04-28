'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import ShareButton from '@/app/components/ShareButton';
import { stripHtml } from '@/app/_lib/html';

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
  const locale = useLocale();
  const searchParams = useSearchParams();
  const tipoRaw = searchParams.get('tipo') ?? 'todos';
  const tipoParam = tipoRaw.toUpperCase();
  const langQs = `&lang=${encodeURIComponent(locale)}`;
  const TIPOS = [
    { key: 'todos', label: t('all') },
    { key: 'noticia', label: t('news') },
    { key: 'evento', label: t('events') },
    { key: 'articulo', label: t('articles') },
  ];
  const tipoToLabel: Record<string, string> = {
    NOTICIA: t('news'),
    EVENTO: t('events'),
    ARTICULO: t('articles'),
  };
  const dateLocale = locale === 'es' ? 'es-ES' : locale === 'ca' ? 'ca-ES' : locale === 'en' ? 'en-GB' : locale === 'fr' ? 'fr-FR' : locale === 'de' ? 'de-DE' : locale === 'pt' ? 'pt-PT' : locale === 'it' ? 'it-IT' : 'es-ES';
  
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
          fetches.push({ url: `/api/public/contenidos?scope=ASOCIACION&tipo=NOTICIA&limit=50${langQs}`, tipo: 'NOTICIA', source: 'contenido' });
          fetches.push({ url: `/api/public/noticias?limit=50${langQs}`, tipo: 'NOTICIA', source: 'notificacion' });
        }
        if (tipoParam === 'TODOS' || tipoParam === 'EVENTO') {
          fetches.push({ url: `/api/public/contenidos?scope=ASOCIACION&tipo=EVENTO&limit=50${langQs}`, tipo: 'EVENTO', source: 'contenido' });
          fetches.push({ url: `/api/public/eventos?limit=50${langQs}`, tipo: 'EVENTO', source: 'notificacion' });
        }
        if (tipoParam === 'TODOS' || tipoParam === 'ARTICULO') {
          fetches.push({ url: `/api/public/contenidos?scope=ASOCIACION&tipo=ARTICULO&limit=50${langQs}`, tipo: 'ARTICULO', source: 'contenido' });
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
          const isEventoA = (a.tipo ?? '').toUpperCase() === 'EVENTO';
          const isEventoB = (b.tipo ?? '').toUpperCase() === 'EVENTO';
          if (isEventoA && isEventoB) {
            return new Date(a.publishedAt ?? a.createdAt ?? 0).getTime() - new Date(b.publishedAt ?? b.createdAt ?? 0).getTime();
          }
          if (isEventoA) return -1;
          if (isEventoB) return 1;
          return new Date(b.publishedAt ?? b.createdAt ?? 0).getTime() - new Date(a.publishedAt ?? a.createdAt ?? 0).getTime();
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
  }, [tipoParam, locale]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">
          {t('pageDesc')}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TIPOS.map((t) => (
          <Link
            key={t.key}
            href={t.key === 'todos' ? '/actualidad' : `/actualidad?tipo=${t.key}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              tipoParam === t.key.toUpperCase()
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {loading ? (
        <div className="min-h-[320px] flex items-center justify-center text-muted-foreground" aria-busy="true">
          {t('loading')}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-border p-6 text-muted-foreground">
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
              ? new Date(fecha).toLocaleDateString(dateLocale, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : '';

            return (
              <article key={item.id} className="border-b border-border pb-6 last:border-0">
                {item.coverUrl && item.coverUrl.trim() && (
                  <Link href={href} className="group mb-4 block">
                    <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                      <img
                        src={item.coverUrl.trim()}
                        alt={item.titulo}
                        width={640}
                        height={360}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>
                  </Link>
                )}

                {/* Misma línea que noticias/evento en detalle: tipo + fecha a la izq., compartir a la dcha. */}
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                      {tipoToLabel[item.tipo] ?? item.tipo}
                    </span>
                    {fechaFormateada && (
                      <>
                        <span className="text-muted-foreground/60">·</span>
                        <span className="text-xs text-muted-foreground">{fechaFormateada}</span>
                      </>
                    )}
                  </div>
                  <ShareButton
                    url={href}
                    title={item.titulo}
                    variant="icon"
                    className="shrink-0"
                  />
                </div>

                <Link href={href} className="group block min-w-0">
                  <h2 className="text-2xl font-semibold group-hover:underline">
                    {item.titulo}
                  </h2>

                  {item.resumen && (
                    <p className="mt-3 line-clamp-2 text-muted-foreground">{stripHtml(item.resumen)}</p>
                  )}

                  <span className="mt-3 inline-block text-sm font-medium text-primary group-hover:underline">
                    {t('readMore')}
                  </span>
                </Link>
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

export default function ActualidadClient() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-6 py-10 text-muted-foreground">...</div>}>
      <ActualidadContent />
    </Suspense>
  );
}
