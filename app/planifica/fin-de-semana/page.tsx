'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
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
    lat?: number;
    lng?: number;
  } | null;
};

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function eventosOrdenadosPorCercania(
  eventos: EventoItem[],
  userLat: number,
  userLng: number
): EventoItem[] {
  return [...eventos].sort((a, b) => {
    const latA = a.pueblo?.lat;
    const lngA = a.pueblo?.lng;
    const latB = b.pueblo?.lat;
    const lngB = b.pueblo?.lng;
    if (latA == null || lngA == null) return 1;
    if (latB == null || lngB == null) return -1;
    const distA = haversineKm(userLat, userLng, latA, lngA);
    const distB = haversineKm(userLat, userLng, latB, lngB);
    return distA - distB;
  });
}

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
  // Eventos con slug propio (Contenido, distinto del pueblo) → /c/slug. Si no hay slug o slug = pueblo → pestaña eventos del pueblo.
  const slugDistintoDelPueblo = e.slug && e.pueblo && e.slug !== e.pueblo.slug;
  const href = slugDistintoDelPueblo
    ? `/c/${e.slug}`
    : e.pueblo
      ? `/pueblos/${e.pueblo.slug}/actualidad?tipo=EVENTO`
      : e.slug
        ? `/c/${e.slug}`
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

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export default function PlanificaFinDeSemanaPage() {
  const locale = useLocale();
  const t = useTranslations('planifica');
  const [data, setData] = useState<PlanificaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNearest, setShowNearest] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestLoading, setNearestLoading] = useState(false);
  const [nearestMode, setNearestMode] = useState<'idle' | 'gps' | 'pueblo'>('idle');
  const [nearestPuebloRef, setNearestPuebloRef] = useState<string | null>(null);
  const nearestSectionRef = useRef<HTMLElement>(null);

  const handleNearestClick = () => {
    if (userCoords && nearestMode === 'gps') {
      setShowNearest(true);
      return;
    }
    setNearestLoading(true);
    if (!navigator.geolocation) {
      setNearestLoading(false);
      // Sin GPS: solo el selector de pueblo está disponible
      return;
    }
    const options: PositionOptions = {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 60000,
    };
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearestMode('gps');
        setShowNearest(true);
        setNearestLoading(false);
      },
      () => {
        // GPS falló silenciosamente — el usuario puede usar el selector de pueblo
        setNearestLoading(false);
      },
      options
    );
  };

  const handlePuebloRefSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    if (!id) return;
    const pueblo = uniquePueblos.find((p) => p.id === id);
    if (!pueblo) return;
    setNearestPuebloRef(e.target.value);
    setUserCoords({ lat: pueblo.lat, lng: pueblo.lng });
    setNearestMode('pueblo');
    setShowNearest(true);
  };

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

  const allEventos: EventoItem[] = data
    ? [...data.asociacion, ...data.norte, ...data.sur, ...data.este, ...data.centro]
    : [];
  const uniquePueblos = useMemo(() => {
    if (!data) return [];
    const all = [...data.asociacion, ...data.norte, ...data.sur, ...data.este, ...data.centro];
    const seen = new Set<number>();
    const list: { id: number; nombre: string; slug: string; lat: number; lng: number }[] = [];
    for (const e of all) {
      const p = e.pueblo;
      if (!p || p.lat == null || p.lng == null || seen.has(p.id)) continue;
      seen.add(p.id);
      list.push({ id: p.id, nombre: p.nombre, slug: p.slug, lat: p.lat, lng: p.lng });
    }
    list.sort((a, b) => a.nombre.localeCompare(b.nombre, locale));
    return list;
  }, [data, locale]);
  const nearestResult =
    showNearest && userCoords && data
      ? (() => {
          const sorted = eventosOrdenadosPorCercania(allEventos, userCoords.lat, userCoords.lng);
          return limitEventosPerPueblo(sorted);
        })()
      : null;
  const nearestEventos = nearestResult?.items ?? [];
  const nearestMoreInPuebloByEventId = nearestResult?.moreInPuebloByEventId ?? new Map<string, MoreInPuebloInfo>();

  useEffect(() => {
    if (showNearest && nearestEventos.length > 0 && nearestSectionRef.current) {
      nearestSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showNearest, nearestEventos.length]);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12 lg:py-16">
        <header className="mb-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div>
              <h1 className="font-serif text-4xl font-medium text-foreground">
                Planifica tu fin de semana
              </h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Eventos de los pueblos y de la asociación para el próximo fin de semana (de lunes a domingo), organizados por región.
              </p>
            </div>
            {!loading && data && totalEventos !== 0 && uniquePueblos.length > 0 && (
              <div className="flex shrink-0 flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={handleNearestClick}
                  disabled={nearestLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted disabled:opacity-60"
                  aria-label={t('nearestButton')}
                >
                  {nearestLoading
                    ? <span className="h-4 w-4 animate-pulse rounded-full bg-primary/30" />
                    : <LocationIcon className="h-5 w-5 text-primary" />
                  }
                  <span>{t('nearestButton')}</span>
                </button>
                <div className="flex items-center gap-2">
                  <label htmlFor="planifica-pueblo-ref" className="text-xs text-muted-foreground whitespace-nowrap">
                    {t('nearestFallbackLabel')}
                  </label>
                  <select
                    id="planifica-pueblo-ref"
                    className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                    value={nearestPuebloRef ?? ''}
                    onChange={handlePuebloRefSelect}
                  >
                    <option value="">{t('nearestFallbackPlaceholder')}</option>
                    {uniquePueblos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </header>

        {nearestLoading && (
          <div className="mb-10 flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-muted-foreground">
            <span className="h-4 w-4 animate-pulse rounded-full bg-primary/30" />
            {t('nearestLoading')}
          </div>
        )}
        {showNearest && userCoords && nearestEventos.length > 0 && (
          <section ref={nearestSectionRef} className="mb-14" id="eventos-mas-cercanos">
            <h2 className="mb-5 font-serif text-2xl font-medium text-foreground">
              {t('nearestTitle')}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {nearestEventos.map((e) => (
                <EventoCard
                  key={e.id}
                  e={e}
                  regionLabel={t('nearestTitle')}
                  locale={locale}
                  moreInPueblo={nearestMoreInPuebloByEventId.get(e.id) ?? null}
                />
              ))}
            </div>
          </section>
        )}

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
