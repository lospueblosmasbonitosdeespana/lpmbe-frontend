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
    comunidad?: string | null;
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

type Region = { key: keyof PlanificaData; label: string };

const REGION_ASOCIACION: Region = { key: 'asociacion', label: 'Asociación' };

/** Las 4 regiones que rotan. Asociación NO entra en la rotación: queda fija arriba. */
const REGIONES_ROTATIVAS_BASE: Region[] = [
  { key: 'norte', label: 'Norte' },
  { key: 'sur', label: 'Sur' },
  { key: 'este', label: 'Este' },
  { key: 'centro', label: 'Centro' },
];

/** Todas las claves (para contar eventos totales sin depender del orden). */
const REGIONES_KEYS_ALL: (keyof PlanificaData)[] = [
  'asociacion', 'norte', 'sur', 'este', 'centro',
];

const MS_PER_DAY = 86_400_000;
const MS_PER_WEEK = 7 * MS_PER_DAY;
/**
 * Lunes 5 enero 1970 (00:00 UTC). Es el lunes más temprano posterior al
 * epoch de JS (jueves 1 enero 1970). Sirve de referencia para contar
 * semanas completas en UTC sin depender de la zona horaria del cliente.
 */
const EPOCH_MONDAY_UTC = 4 * MS_PER_DAY;

/**
 * Rotación de regiones cada lunes 00:00 UTC (≈ 01:00 hora peninsular en
 * invierno y 02:00 en verano). Ciclo de 4 semanas:
 *   semana N   → Norte, Sur, Este, Centro
 *   semana N+1 → Sur, Este, Centro, Norte
 *   semana N+2 → Este, Centro, Norte, Sur
 *   semana N+3 → Centro, Norte, Sur, Este
 *
 * Se calcula en UTC con `Date.now()` para que servidor y cliente devuelvan
 * el mismo orden y no haya warnings de hidratación de Next.js.
 *
 * "Asociación" queda siempre arriba, no participa en la rotación.
 */
function getRegionRotationOffset(nowMs: number = Date.now()): number {
  const weeks = Math.floor((nowMs - EPOCH_MONDAY_UTC) / MS_PER_WEEK);
  return ((weeks % 4) + 4) % 4;
}

function getRegionesOrden(nowMs: number = Date.now()): Region[] {
  const offset = getRegionRotationOffset(nowMs);
  const rotadas = [
    ...REGIONES_ROTATIVAS_BASE.slice(offset),
    ...REGIONES_ROTATIVAS_BASE.slice(0, offset),
  ];
  return [REGION_ASOCIACION, ...rotadas];
}

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
  const [nearestMode, setNearestMode] = useState<'idle' | 'gps'>('idle');
  // Filtros CCAA / provincia
  const [filterCCAA, setFilterCCAA] = useState<string>('');
  const [filterProvincia, setFilterProvincia] = useState<string>('');
  const nearestSectionRef = useRef<HTMLElement>(null);

  const handleNearestClick = () => {
    if (userCoords && nearestMode === 'gps') {
      setShowNearest(true);
      return;
    }
    setNearestLoading(true);
    if (!navigator.geolocation) {
      setNearestLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearestMode('gps');
        setShowNearest(true);
        setNearestLoading(false);
      },
      () => { setNearestLoading(false); },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleBackToRegions = () => {
    setShowNearest(false);
    setUserCoords(null);
    setNearestMode('idle');
    setFilterCCAA('');
    setFilterProvincia('');
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/planifica/fin-de-semana?lang=${locale}`, { cache: 'no-store' });
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
    return () => { cancelled = true; };
  }, [locale]);

  const totalEventos = data && REGIONES_KEYS_ALL.reduce((acc, key) => acc + data[key].length, 0);

  // Orden rotado de regiones (memoizado por render). Asociación arriba siempre.
  const REGIONES = useMemo(() => getRegionesOrden(), []);

  const allEventos: EventoItem[] = data
    ? [...data.asociacion, ...data.norte, ...data.sur, ...data.este, ...data.centro]
    : [];

  // Listas únicas de CCAA y provincias a partir de los pueblos con eventos
  const { uniqueCCAA, uniqueProvincias } = useMemo(() => {
    const ccaaSet = new Set<string>();
    const provSet = new Set<string>();
    for (const e of allEventos) {
      if (e.pueblo?.comunidad) ccaaSet.add(e.pueblo.comunidad);
      if (e.pueblo?.provincia) provSet.add(e.pueblo.provincia);
    }
    return {
      uniqueCCAA: Array.from(ccaaSet).sort((a, b) => a.localeCompare(b, locale)),
      uniqueProvincias: Array.from(provSet).sort((a, b) => a.localeCompare(b, locale)),
    };
  }, [allEventos, locale]);

  // Filtrado por CCAA y/o provincia
  const filteredEventos: EventoItem[] = useMemo(() => {
    if (!filterCCAA && !filterProvincia) return allEventos;
    return allEventos.filter(e => {
      if (filterCCAA && e.pueblo?.comunidad !== filterCCAA) return false;
      if (filterProvincia && e.pueblo?.provincia !== filterProvincia) return false;
      return true;
    });
  }, [allEventos, filterCCAA, filterProvincia]);

  const isFiltered = !!filterProvincia || !!filterCCAA;

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
        <header className="mb-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div>
              <h1 className="font-serif text-4xl font-medium text-foreground">
                Planifica tu fin de semana
              </h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Eventos de los pueblos y de la asociación para el próximo fin de semana (de lunes a domingo), organizados por región.
              </p>
            </div>
            {!loading && data && totalEventos !== 0 && (
              <div className="flex shrink-0 flex-col items-end gap-3">
                {/* Botón GPS */}
                <button
                  type="button"
                  onClick={handleNearestClick}
                  disabled={nearestLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted disabled:opacity-60"
                  aria-label={t('nearestButton')}
                >
                  {nearestLoading
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    : <LocationIcon className="h-5 w-5 text-primary" />
                  }
                  <span>{t('nearestButton')}</span>
                </button>
                {/* Filtro por provincia */}
                {uniqueProvincias.length > 0 && (
                  <div className="flex flex-col items-end gap-2">
                    {uniqueCCAA.length > 0 && (
                      <select
                        id="planifica-ccaa"
                        className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground max-w-[200px]"
                        value={filterCCAA}
                        onChange={e => { setFilterCCAA(e.target.value); setFilterProvincia(''); setShowNearest(false); }}
                      >
                        <option value="">{t('filterPlaceholderCCAA')}</option>
                        {uniqueCCAA.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    )}
                    <select
                      id="planifica-provincia"
                      className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground max-w-[200px]"
                      value={filterProvincia}
                      onChange={e => { setFilterProvincia(e.target.value); setShowNearest(false); }}
                    >
                      <option value="">{t('filterPlaceholderProvincia')}</option>
                      {(filterCCAA
                        ? uniqueProvincias.filter(p => allEventos.some(e => e.pueblo?.comunidad === filterCCAA && e.pueblo?.provincia === p))
                        : uniqueProvincias
                      ).map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                )}
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

        {/* Vista "Eventos más cercanos" — oculta la vista por regiones */}
        {showNearest && userCoords && nearestEventos.length > 0 ? (
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
            {/* Botón volver a vista por regiones */}
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={handleBackToRegions}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
              >
                {t('backToRegions')}
              </button>
            </div>
          </section>
        ) : loading ? (
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
            <p className="text-muted-foreground">No hay eventos previstos para el próximo fin de semana.</p>
            <Link href="/pueblos" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
              Explorar pueblos →
            </Link>
          </div>
        ) : isFiltered ? (
          /* Vista filtrada por CCAA o provincia */
          <div>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando eventos en <span className="font-semibold text-foreground">{filterProvincia || filterCCAA}</span>
              </p>
              <button
                type="button"
                onClick={handleBackToRegions}
                className="text-sm font-medium text-primary hover:underline"
              >
                {t('backToRegions')}
              </button>
            </div>
            {(() => {
              const { items, moreInPuebloByEventId } = limitEventosPerPueblo(filteredEventos);
              return (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((e) => (
                    <EventoCard key={e.id} e={e} regionLabel={filterProvincia} locale={locale} moreInPueblo={moreInPuebloByEventId.get(e.id) ?? null} />
                  ))}
                </div>
              );
            })()}
          </div>
        ) : (
          /* Vista normal por regiones */
          <div>
            {REGIONES.map(({ key, label }) => (
              <RegionSection key={key} label={label} eventos={data[key]} locale={locale} />
            ))}
          </div>
        )}

        <footer className="mt-14 pt-8 border-t border-border">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
            ← Volver al inicio
          </Link>
        </footer>
      </div>
    </main>
  );
}
