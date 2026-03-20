'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import ShareButton from '@/app/components/ShareButton';
import { useTranslations } from 'next-intl';

type Item = {
  id: number;
  cartelVerticalUrl: string | null;
  cartelHorizontalUrl: string | null;
  interesTuristico: 'NINGUNO' | 'REGIONAL' | 'NACIONAL' | 'INTERNACIONAL';
  pueblo: {
    nombre: string;
    slug: string;
    provincia: string;
    comunidad: string;
    lat?: number | null;
    lng?: number | null;
    foto_destacada: string | null;
  };
  agenda: Array<{ id: number }>;
  dias: Array<{ id: number }>;
};

type Config = {
  titulo: string;
  subtitulo: string | null;
  anio: number;
  activo: boolean;
};

function badgeInteres(value: Item['interesTuristico'], t: (key: string) => string) {
  if (value === 'INTERNACIONAL') return t('tourismInterestInternational');
  if (value === 'NACIONAL') return t('tourismInterestNational');
  if (value === 'REGIONAL') return t('tourismInterestRegional');
  return null;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export default function SemanaSantaLandingClient({
  config,
  pueblos,
}: {
  config: Config | null;
  pueblos: Item[];
}) {
  const t = useTranslations('planifica.semanaSanta');
  const [filterCCAA, setFilterCCAA] = useState('');
  const [filterProvincia, setFilterProvincia] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestLoading, setNearestLoading] = useState(false);

  const title = config?.titulo ?? t('defaultTitle');
  const totalEventos = pueblos.reduce((acc, p) => acc + p.agenda.length, 0);
  const totalDias = pueblos.reduce((acc, p) => acc + p.dias.length, 0);

  const uniqueCCAA = useMemo(
    () =>
      Array.from(new Set(pueblos.map((p) => p.pueblo.comunidad).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [pueblos],
  );

  const uniqueProvincias = useMemo(
    () =>
      Array.from(
        new Set(
          pueblos
            .filter((p) => (!filterCCAA ? true : p.pueblo.comunidad === filterCCAA))
            .map((p) => p.pueblo.provincia)
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, 'es')),
    [pueblos, filterCCAA],
  );

  const filteredPueblos = useMemo(
    () =>
      pueblos.filter((p) => {
        if (filterCCAA && p.pueblo.comunidad !== filterCCAA) return false;
        if (filterProvincia && p.pueblo.provincia !== filterProvincia) return false;
        return true;
      }),
    [pueblos, filterCCAA, filterProvincia],
  );

  const sortedPueblos = useMemo(() => {
    if (!userCoords) return filteredPueblos;
    return [...filteredPueblos].sort((a, b) => {
      const aLat = a.pueblo.lat;
      const aLng = a.pueblo.lng;
      const bLat = b.pueblo.lat;
      const bLng = b.pueblo.lng;
      if (aLat == null || aLng == null) return 1;
      if (bLat == null || bLng == null) return -1;
      const da = haversineKm(userCoords.lat, userCoords.lng, aLat, aLng);
      const db = haversineKm(userCoords.lat, userCoords.lng, bLat, bLng);
      return da - db;
    });
  }, [filteredPueblos, userCoords]);

  const activateNearest = () => {
    if (userCoords) return;
    if (!navigator.geolocation) return;
    setNearestLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearestLoading(false);
      },
      () => setNearestLoading(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  };

  const clearNearest = () => {
    setUserCoords(null);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-50 via-background to-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 px-7 py-8 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-300">{t('eyebrow')}</p>
            <h1 className="mt-2 font-serif text-4xl font-medium">{title}</h1>
          </div>
          <div className="px-7 py-6">
            <p className="text-muted-foreground">
              {config?.subtitulo || t('subtitleFallback')}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {config?.anio && <span className="rounded-full border bg-background px-3 py-1">{t('edition', { year: config.anio })}</span>}
              <span className="rounded-full border bg-background px-3 py-1">{t('activeVillages', { count: pueblos.length })}</span>
              <span className="rounded-full border bg-background px-3 py-1">{t('agendaEvents', { count: totalEventos })}</span>
              <span className="rounded-full border bg-background px-3 py-1">{t('processionDays', { count: totalDias })}</span>
            </div>

            {pueblos.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={activateNearest}
                  disabled={nearestLoading || Boolean(userCoords)}
                  className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
                >
                  {nearestLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  ) : (
                    <LocationIcon className="h-4 w-4 text-primary" />
                  )}
                  {userCoords ? t('showingNearest') : t('showNearest')}
                </button>
                {userCoords && (
                  <button
                    type="button"
                    onClick={clearNearest}
                    className="rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    {t('clearNearest')}
                  </button>
                )}
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={filterCCAA}
                  onChange={(e) => {
                    setFilterCCAA(e.target.value);
                    setFilterProvincia('');
                  }}
                >
                  <option value="">{t('allRegions')}</option>
                  {uniqueCCAA.map((ccaa) => (
                    <option key={ccaa} value={ccaa}>
                      {ccaa}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  value={filterProvincia}
                  onChange={(e) => setFilterProvincia(e.target.value)}
                >
                  <option value="">{t('allProvinces')}</option>
                  {uniqueProvincias.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </header>

        {sortedPueblos.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
            {t('noVillagesForFilters')}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedPueblos.map((p) => {
              const verticalImage = p.cartelVerticalUrl && p.cartelVerticalUrl.trim();
              const horizontalImage = p.cartelHorizontalUrl && p.cartelHorizontalUrl.trim();
              const image = verticalImage || horizontalImage || p.pueblo.foto_destacada;
              const badge = badgeInteres(p.interesTuristico, t);
              const distanceKm =
                userCoords && p.pueblo.lat != null && p.pueblo.lng != null
                  ? haversineKm(userCoords.lat, userCoords.lng, p.pueblo.lat, p.pueblo.lng)
                  : null;

              return (
                <div
                  key={p.id}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="absolute right-3 top-3 z-20">
                    <ShareButton
                      url={`/planifica/semana-santa/pueblo/${p.pueblo.slug}`}
                      title={t('shareVillageTitle', { village: p.pueblo.nombre })}
                      variant="icon"
                      className="rounded-full bg-card/90 p-1 shadow hover:bg-card"
                    />
                  </div>
                  <Link href={`/planifica/semana-santa/pueblo/${p.pueblo.slug}`} className="block">
                  <div className="relative h-72 bg-background">
                    {image ? (
                      <img
                        src={image}
                        alt={p.pueblo.nombre}
                        className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">{t('defaultTitle')}</div>
                    )}
                    {badge && (
                      <span className="absolute left-3 top-3 rounded-full bg-[#b2643a]/90 px-2.5 py-1 text-[11px] font-medium text-white">
                        {badge}
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
                  </div>
                  <div className="p-5">
                    <h2 className="font-semibold text-foreground group-hover:text-primary">{p.pueblo.nombre}</h2>
                    <p className="text-sm text-muted-foreground">
                      {p.pueblo.provincia}, {p.pueblo.comunidad}
                    </p>
                    {distanceKm != null && (
                      <p className="mt-2 text-xs font-medium text-primary">{t('distanceFromYou', { km: distanceKm.toFixed(1) })}</p>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">
                      {t('agendaAndProcessions', { agenda: p.agenda.length, days: p.dias.length })}
                    </p>
                    <p className="mt-3 text-sm font-medium text-primary">{t('viewVillagePage')}</p>
                  </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
