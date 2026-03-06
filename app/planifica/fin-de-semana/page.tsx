'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatEventoRangeEs } from '@/app/_lib/dates';
import { stripHtml } from '@/app/_lib/html';
import ShareButton from '@/app/components/ShareButton';

type EventoItem = {
  id: string;
  fuente: 'asociacion' | 'pueblo';
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

/** Para la 2ª tarjeta de un pueblo con >2 eventos: mostrar "Hay más eventos..." y enlace a la página del pueblo. */
type MoreInPuebloInfo = { nombre: string; slug: string };

/**
 * Limita a 2 eventos por pueblo; devuelve la lista limitada y un mapa de eventId -> moreInPueblo
 * para pintar en la parte de abajo de la 2ª tarjeta la etiqueta y el "Ver más" al listado del pueblo.
 */
function limitEventosPerPueblo(eventos: EventoItem[]): {
  items: EventoItem[];
  moreInPuebloByEventId: Map<string, MoreInPuebloInfo>;
} {
  const countByPueblo = new Map<number, number>();
  for (const e of eventos) {
    if (e.pueblo) {
      const id = e.pueblo.id;
      countByPueblo.set(id, (countByPueblo.get(id) ?? 0) + 1);
    }
  }

  const displayed = new Map<number, number>();
  const moreInPuebloByEventId = new Map<string, MoreInPuebloInfo>();
  const items: EventoItem[] = [];

  for (const e of eventos) {
    if (!e.pueblo) {
      items.push(e);
      continue;
    }
    const id = e.pueblo.id;
    const total = countByPueblo.get(id) ?? 0;
    const count = displayed.get(id) ?? 0;

    if (count < 2) {
      items.push(e);
      displayed.set(id, count + 1);
      if (count + 1 === 2 && total > 2) {
        moreInPuebloByEventId.set(e.id, {
          nombre: e.pueblo.nombre,
          slug: e.pueblo.slug,
        });
      }
    }
  }
  return { items, moreInPuebloByEventId };
}

type PlanificaData = {
  asociacion: EventoItem[];
  norte: EventoItem[];
  sur: EventoItem[];
  este: EventoItem[];
  centro: EventoItem[];
};

const REGIONES: { key: keyof PlanificaData; label: string }[] = [
  { key: 'asociacion', label: 'Asociación' },
  { key: 'norte', label: 'Norte' },
  { key: 'sur', label: 'Sur' },
  { key: 'este', label: 'Este' },
  { key: 'centro', label: 'Centro' },
];

function EventoCard({
  e,
  regionLabel,
  locale,
  moreInPueblo,
}: {
  e: EventoItem;
  regionLabel: string;
  locale: string;
  moreInPueblo?: MoreInPuebloInfo | null;
}) {
  const t = useTranslations('planifica');
  // Eventos con slug (Contenido) → página del contenido /c/slug. Sin slug (Evento pueblo) → actualidad/eventos del pueblo.
  const href = e.slug
    ? `/c/${e.slug}`
    : e.pueblo
      ? `/pueblos/${e.pueblo.slug}/actualidad?tipo=EVENTO`
      : null;

  const shareButton = (
    <div className="absolute right-2 top-2 z-20">
      <ShareButton
        url={href ?? (e.pueblo ? `/pueblos/${e.pueblo.slug}/actualidad?tipo=EVENTO` : '/planifica/fin-de-semana')}
        title={e.titulo}
        variant="icon"
        className="rounded-full bg-card/90 p-2 shadow hover:bg-card"
      />
    </div>
  );

  const linkableContent = (
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
        {e.pueblo && (
          <p className="mt-1.5 text-sm font-semibold text-foreground">
            {e.pueblo.provincia ? `${e.pueblo.nombre} (${e.pueblo.provincia})` : e.pueblo.nombre}
          </p>
        )}
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

  const moreBlock = moreInPueblo && (
    <div className="border-t border-border px-4 pb-4 pt-3">
      <span className="inline-block rounded bg-red-600 px-2 py-1 text-sm font-medium text-white">
        {t('moreInPueblo', { pueblo: moreInPueblo.nombre })}
      </span>
      <Link
        href={`/planifica/fin-de-semana/pueblo/${moreInPueblo.slug}`}
        className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
      >
        {t('verMasEventos')} →
      </Link>
    </div>
  );

  const cardClass = 'group block overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-md relative';
  return (
    <div className={cardClass}>
      <div className="relative">
        {href ? (
          <Link href={href} className="block">
            {linkableContent}
          </Link>
        ) : (
          linkableContent
        )}
        {shareButton}
      </div>
      {moreBlock}
    </div>
  );
}

function RegionSection({
  label,
  eventos,
  locale,
}: {
  label: string;
  eventos: EventoItem[];
  locale: string;
}) {
  const { items, moreInPuebloByEventId } = limitEventosPerPueblo(eventos);
  if (items.length === 0) return null;

  return (
    <section className="mb-14">
      <h2 className="mb-5 font-serif text-2xl font-medium text-foreground">
        {label}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((e) => (
          <EventoCard
            key={e.id}
            e={e}
            regionLabel={label}
            locale={locale}
            moreInPueblo={moreInPuebloByEventId.get(e.id) ?? null}
          />
        ))}
      </div>
    </section>
  );
}

export default function PlanificaFinDeSemanaPage() {
  const locale = useLocale();
  const [data, setData] = useState<PlanificaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/planifica/fin-de-semana?lang=${locale}`, {
          cache: 'no-store',
        });
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
  }, [locale]);

  const totalEventos =
    data && REGIONES.reduce((acc, r) => acc + data[r.key].length, 0);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12 lg:py-16">
        <header className="mb-12">
          <h1 className="font-serif text-4xl font-medium text-foreground">
            Planifica tu fin de semana
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Eventos de los pueblos y de la asociación para el próximo fin de semana (de lunes a domingo), organizados por región.
          </p>
        </header>

        {loading ? (
          <div className="flex items-center gap-3 py-12 text-muted-foreground">
            <span className="h-4 w-4 animate-pulse rounded-full bg-primary/30" />
            Cargando eventos...
          </div>
        ) : !data ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            No se pudieron cargar los eventos. Inténtalo de nuevo más tarde.
          </div>
        ) : totalEventos === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              No hay eventos previstos para el próximo fin de semana.
            </p>
            <Link
              href="/pueblos"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              Explorar pueblos →
            </Link>
          </div>
        ) : (
          <div>
            {REGIONES.map(({ key, label }) => (
              <RegionSection key={key} label={label} eventos={data[key]} locale={locale} />
            ))}
          </div>
        )}

        <footer className="mt-14 pt-8 border-t border-border">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            ← Volver al inicio
          </Link>
        </footer>
      </div>
    </main>
  );
}
