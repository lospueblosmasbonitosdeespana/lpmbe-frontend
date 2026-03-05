'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { formatEventoRangeEs } from '@/app/_lib/dates';
import { stripHtml } from '@/app/_lib/html';

type EventoItem = {
  id: string;
  fuente: string;
  titulo: string;
  slug: string | null;
  resumen: string | null;
  coverUrl: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  pueblo: {
    id: number;
    nombre: string;
    slug: string;
    provincia?: string | null;
  } | null;
};

type PuebloPlanificaData = {
  pueblo: { id: number; nombre: string; slug: string; provincia?: string | null } | null;
  eventos: EventoItem[];
};

export default function PlanificaPuebloPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const locale = useLocale();
  const [data, setData] = useState<PuebloPlanificaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setData(null);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/public/planifica/fin-de-semana/pueblo/${encodeURIComponent(slug)}?lang=${locale}`,
          { cache: 'no-store' }
        );
        if (!res.ok) throw new Error('Error');
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug, locale]);

  if (!slug) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <p className="text-muted-foreground">Pueblo no especificado.</p>
          <Link href="/planifica/fin-de-semana" className="mt-4 inline-block text-sm text-primary hover:underline">
            ← Volver a Planifica tu fin de semana
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="flex items-center gap-3 py-12 text-muted-foreground">
            <span className="h-4 w-4 animate-pulse rounded-full bg-primary/30" />
            Cargando eventos...
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            No se pudieron cargar los eventos de este pueblo.
          </div>
          <Link href="/planifica/fin-de-semana" className="mt-4 inline-block text-sm text-primary hover:underline">
            ← Volver a Planifica tu fin de semana
          </Link>
        </div>
      </main>
    );
  }

  const { pueblo, eventos } = data;
  const nombrePueblo = pueblo?.nombre ?? slug;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12 lg:py-16">
        <header className="mb-10">
          <Link
            href="/planifica/fin-de-semana"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            ← Planifica tu fin de semana
          </Link>
          <h1 className="mt-4 font-serif text-3xl font-medium text-foreground">
            Eventos en {nombrePueblo} este fin de semana
          </h1>
          {pueblo?.provincia && (
            <p className="mt-1 text-muted-foreground">{pueblo.provincia}</p>
          )}
        </header>

        {eventos.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            No hay eventos previstos para este pueblo en el próximo fin de semana.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {eventos.map((e) => (
              <EventoCard key={e.id} e={e} locale={locale} />
            ))}
          </div>
        )}

        <footer className="mt-14 border-t border-border pt-8">
          <Link
            href="/planifica/fin-de-semana"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            ← Volver a Planifica tu fin de semana
          </Link>
          {pueblo && (
            <Link
              href={`/pueblos/${pueblo.slug}`}
              className="ml-4 text-sm text-primary hover:underline"
            >
              Ver ficha de {pueblo.nombre} →
            </Link>
          )}
        </footer>
      </div>
    </main>
  );
}

function EventoCard({ e, locale }: { e: EventoItem; locale: string }) {
  const href = e.slug
    ? `/c/${e.slug}`
    : e.pueblo
      ? `/pueblos/${e.pueblo.slug}`
      : null;

  const content = (
    <>
      {e.coverUrl && e.coverUrl.trim() ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
          <img
            src={e.coverUrl.trim()}
            alt={e.titulo}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/10] w-full items-center justify-center bg-muted text-muted-foreground">
          <span className="text-4xl font-serif">·</span>
        </div>
      )}
      <div className="flex flex-col p-4">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {formatEventoRangeEs(e.fechaInicio, e.fechaFin, locale)}
        </span>
        <h3 className="mt-2 font-serif text-lg font-medium text-foreground transition-colors group-hover:text-primary">
          {e.titulo}
        </h3>
        {e.resumen && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {stripHtml(e.resumen)}
          </p>
        )}
        {href && (
          <span className="mt-3 inline-block text-sm font-medium text-primary">
            Ver más →
          </span>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-md"
      >
        {content}
      </Link>
    );
  }
  return (
    <div className="block overflow-hidden rounded-lg border border-border bg-card">
      {content}
    </div>
  );
}
