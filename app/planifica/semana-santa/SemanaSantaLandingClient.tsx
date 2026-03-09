'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

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

function badgeInteres(value: Item['interesTuristico']) {
  if (value === 'INTERNACIONAL') return 'Interés Turístico Internacional';
  if (value === 'NACIONAL') return 'Interés Turístico Nacional';
  if (value === 'REGIONAL') return 'Interés Turístico Regional';
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
  const [filterCCAA, setFilterCCAA] = useState('');
  const [filterProvincia, setFilterProvincia] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestLoading, setNearestLoading] = useState(false);

  const title = config?.titulo ?? 'Semana Santa';
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
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-300">Experiencias · Planifica</p>
            <h1 className="mt-2 font-serif text-4xl font-medium">{title}</h1>
          </div>
          <div className="px-7 py-6">
            <p className="text-muted-foreground">
              {config?.subtitulo || 'Selecciona un pueblo participante para ver su cartel, agenda y procesiones por día.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {config?.anio && <span className="rounded-full border bg-background px-3 py-1">Edición {config.anio}</span>}
              <span className="rounded-full border bg-background px-3 py-1">{pueblos.length} pueblos activos</span>
              <span className="rounded-full border bg-background px-3 py-1">{totalEventos} eventos agenda</span>
              <span className="rounded-full border bg-background px-3 py-1">{totalDias} días procesionales</span>
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
                  {userCoords ? 'Mostrando más cercanos' : 'Ver más cercanos'}
                </button>
                {userCoords && (
                  <button
                    type="button"
                    onClick={clearNearest}
                    className="rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    Quitar cercanía
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
                  <option value="">Todas las CCAA</option>
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
                  <option value="">Todas las provincias</option>
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
            No hay pueblos para los filtros seleccionados.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedPueblos.map((p) => {
              const verticalImage = p.cartelVerticalUrl && p.cartelVerticalUrl.trim();
              const horizontalImage = p.cartelHorizontalUrl && p.cartelHorizontalUrl.trim();
              const image = verticalImage || horizontalImage || p.pueblo.foto_destacada;
              const isVerticalPriority = Boolean(verticalImage);
              const badge = badgeInteres(p.interesTuristico);
              const distanceKm =
                userCoords && p.pueblo.lat != null && p.pueblo.lng != null
                  ? haversineKm(userCoords.lat, userCoords.lng, p.pueblo.lat, p.pueblo.lng)
                  : null;

              return (
                <Link
                  key={p.id}
                  href={`/planifica/semana-santa/pueblo/${p.pueblo.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className={`relative bg-muted ${isVerticalPriority ? 'h-72' : 'h-52'}`}>
                    {image ? (
                      <img
                        src={image}
                        alt={p.pueblo.nombre}
                        className={`h-full w-full transition-transform duration-300 group-hover:scale-105 ${
                          isVerticalPriority ? 'bg-stone-100 object-contain p-2' : 'object-cover'
                        }`}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">Semana Santa</div>
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
                      <p className="mt-2 text-xs font-medium text-primary">{distanceKm.toFixed(1)} km de ti</p>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">
                      {p.agenda.length} eventos en agenda · {p.dias.length} días de procesiones
                    </p>
                    <p className="mt-3 text-sm font-medium text-primary">Ver página del pueblo →</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
