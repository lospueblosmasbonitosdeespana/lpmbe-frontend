'use client';

import { useState } from 'react';
import { Zap, Navigation, MapPin, ChevronDown } from 'lucide-react';

type CargadorPropio = {
  id: number; nombre: string | null; lat: number | null; lng: number | null;
  potenciaKw: number | null; etiquetaPotencia: string | null;
  googleMapsUrl: string | null; appleMapsUrl: string | null;
};

type CargadorCercano = {
  id: number; ocmId: number; nombre: string | null; direccion: string | null;
  localidad: string | null; lat: number; lng: number;
  potenciaMaxKw: number | null; numConectores: number | null;
  operador: string | null; acceso: string | null; distanciaKm: number;
  etiquetaPotencia: string | null;
  googleMapsUrl: string; appleMapsUrl: string;
};

function colorPotencia(kw: number | null | undefined): string {
  if (kw == null) return '#16a34a';
  if (kw >= 150) return '#7c3aed';
  if (kw >= 50) return '#059669';
  if (kw >= 22) return '#0891b2';
  if (kw >= 7) return '#16a34a';
  return '#6b7280';
}

function NavButton({ googleMapsUrl, appleMapsUrl }: { googleMapsUrl: string; appleMapsUrl: string }) {
  const isIos = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const url = isIos ? appleMapsUrl : googleMapsUrl;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
    >
      <Navigation className="w-3.5 h-3.5" />
      Cómo llegar
    </a>
  );
}

export function CargaElectricaSection({
  puebloNombre,
  propios,
  cercanos,
}: {
  puebloNombre: string;
  propios: CargadorPropio[];
  cercanos: CargadorCercano[];
}) {
  if (propios.length === 0 && cercanos.length === 0) return null;

  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100">
            <Zap className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Carga eléctrica</h2>
            <p className="text-sm text-gray-500">Puntos de recarga para vehículos eléctricos</p>
          </div>
        </div>

        {/* Cargadores propios del pueblo */}
        {propios.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              En {puebloNombre}
            </h3>
            <div className="space-y-3">
              {propios.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: colorPotencia(c.potenciaKw) }}
                    />
                    <div>
                      <span className="font-medium text-gray-900">
                        {c.nombre || 'Cargador eléctrico'}
                      </span>
                      {c.etiquetaPotencia && (
                        <span className="ml-2 text-sm text-gray-500">
                          {c.etiquetaPotencia}
                          {c.potenciaKw ? ` (${c.potenciaKw} kW)` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {c.googleMapsUrl && c.appleMapsUrl && (
                    <NavButton googleMapsUrl={c.googleMapsUrl} appleMapsUrl={c.appleMapsUrl} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cargadores cercanos (OCM) */}
        {cercanos.length > 0 && (
          <CercanosList cercanos={cercanos} />
        )}
      </div>
    </section>
  );
}

const INITIAL_VISIBLE = 3;

function CercanosList({ cercanos }: { cercanos: CargadorCercano[] }) {
  const [expanded, setExpanded] = useState(false);
  const needsCollapse = cercanos.length > INITIAL_VISIBLE;
  const visible = expanded ? cercanos : cercanos.slice(0, INITIAL_VISIBLE);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
        Cerca del pueblo
        <span className="ml-2 text-xs font-normal normal-case text-gray-400">
          ({cercanos.length} punto{cercanos.length !== 1 ? 's' : ''})
        </span>
      </h3>
      <div className="space-y-2">
        {visible.map((c) => (
          <CargadorCercanoCard key={c.id} c={c} />
        ))}
      </div>

      {needsCollapse && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded
            ? 'Ver menos'
            : `Ver ${cercanos.length - INITIAL_VISIBLE} cargadores más`}
        </button>
      )}

      <p className="mt-4 text-xs text-gray-400 text-center">
        Datos: <a href="https://openchargemap.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">OpenChargeMap</a> (CC BY 4.0)
      </p>
    </div>
  );
}

function CargadorCercanoCard({ c }: { c: CargadorCercano }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: colorPotencia(c.potenciaMaxKw) }}
        />
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
            A {c.distanciaKm} km
          </span>
          {c.etiquetaPotencia && (
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white whitespace-nowrap"
              style={{ backgroundColor: colorPotencia(c.potenciaMaxKw) }}
            >
              {c.etiquetaPotencia} · {c.potenciaMaxKw} kW
            </span>
          )}
          <span className="text-sm text-gray-900 truncate">
            {c.operador && <span className="font-medium">{c.operador}</span>}
            {c.operador && (c.direccion || c.localidad) && ' — '}
            {c.direccion || c.localidad || c.nombre || ''}
          </span>
        </div>
      </div>
      <div className="flex-shrink-0 ml-2">
        <NavButton googleMapsUrl={c.googleMapsUrl} appleMapsUrl={c.appleMapsUrl} />
      </div>
    </div>
  );
}
