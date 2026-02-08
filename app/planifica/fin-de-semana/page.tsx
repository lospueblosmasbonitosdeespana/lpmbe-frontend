'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatEventoRangeEs } from '@/app/_lib/dates';
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
  } | null;
};

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

function EventoCard({ e, regionLabel }: { e: EventoItem; regionLabel: string }) {
  const href =
    e.fuente === 'asociacion' && e.slug
      ? `/c/${e.slug}`
      : e.pueblo
        ? `/pueblos/${e.pueblo.slug}`
        : null;

  const contenido = (
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
          {formatEventoRangeEs(e.fechaInicio, e.fechaFin)}
        </span>
        <h3 className="mt-2 font-serif text-lg font-medium text-foreground transition-colors group-hover:text-primary">
          {e.titulo}
        </h3>
        {e.pueblo && (
          <p className="mt-1 text-sm text-muted-foreground">{e.pueblo.nombre}</p>
        )}
        {e.resumen && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {e.resumen}
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
        {contenido}
      </Link>
    );
  }

  return (
    <div className="block overflow-hidden rounded-lg border border-border bg-card">
      {contenido}
    </div>
  );
}

function RegionSection({
  label,
  eventos,
}: {
  label: string;
  eventos: EventoItem[];
}) {
  if (eventos.length === 0) return null;

  return (
    <section className="mb-14">
      <h2 className="mb-5 font-serif text-2xl font-medium text-foreground">
        {label}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {eventos.map((e) => (
          <EventoCard key={e.id} e={e} regionLabel={label} />
        ))}
      </div>
    </section>
  );
}

export default function PlanificaFinDeSemanaPage() {
  const [data, setData] = useState<PlanificaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/public/planifica/fin-de-semana', {
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
  }, []);

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
            Eventos de los pueblos y de la asociación en los próximos 7 días,
            organizados por región.
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
              No hay eventos previstos en los próximos 7 días.
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
              <RegionSection key={key} label={label} eventos={data[key]} />
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
