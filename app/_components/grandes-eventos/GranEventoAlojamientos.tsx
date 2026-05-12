'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { BedDouble, MapPin, Phone, Globe, Search, X, Hourglass, AlertTriangle } from 'lucide-react';
import type { GranEventoAlojamiento } from '@/lib/grandes-eventos';
import { pickI18n } from '@/lib/grandes-eventos';

/**
 * Sección pública de alojamientos. Agrupa por noche (fechaCheckIn) y muestra
 * los hoteles asignados a esa noche con sus delegaciones y personas. Permite:
 * - Buscar por nombre, apellido, delegación, hotel...
 * - Abrir el hotel en Google Maps (lat/lng → https://maps.google.com)
 * - Llamar al hotel y abrir su web.
 */
export default function GranEventoAlojamientos({
  alojamientos,
}: {
  alojamientos: GranEventoAlojamiento[];
}) {
  const locale = useLocale();
  const t = useTranslations('granEvento.alojamientos');
  const [query, setQuery] = useState('');

  const grupos = useMemo(() => {
    const byDate = new Map<string, GranEventoAlojamiento[]>();
    for (const a of alojamientos) {
      const key = a.fechaCheckIn.substring(0, 10);
      const arr = byDate.get(key) ?? [];
      arr.push(a);
      byDate.set(key, arr);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([fecha, hoteles]) => ({ fecha, hoteles }));
  }, [alojamientos]);

  /**
   * Para auto-linking de notas: lista de todos los hoteles del evento con
   * coordenadas (orden por longitud de nombre desc para evitar que
   * "Convento" eclipse a "Hotel Convento San Francisco").
   */
  const hotelesEnlazables = useMemo(
    () =>
      alojamientos
        .filter((h) => (h.lat != null && h.lng != null) || h.nombre)
        .map((h) => ({
          id: h.id,
          nombre: h.nombre,
          lat: h.lat,
          lng: h.lng,
          ciudad: h.ciudad,
        }))
        .sort((a, b) => b.nombre.length - a.nombre.length),
    [alojamientos],
  );

  const q = query.trim().toLowerCase();
  const matches = (text: string) => text.toLowerCase().includes(q);

  if (alojamientos.length === 0) {
    return null;
  }

  return (
    <section
      id="alojamientos"
      className="border-t border-stone-100 bg-gradient-to-br from-amber-50/40 via-stone-50/60 to-emerald-50/30 px-6 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700/80">
              {t('kicker')}
            </p>
            <div className="mt-3 mb-3 inline-flex h-1 w-12 rounded-full bg-amber-700" />
            <h2 className="text-2xl font-bold text-stone-900 sm:text-3xl">{t('titulo')}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-stone-600 sm:text-base">{t('intro')}</p>
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('buscarPlaceholder')}
            className="flex-1 bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              aria-label="Limpiar"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="space-y-10">
          {grupos.map(({ fecha, hoteles }, i) => (
            <NocheGroup
              key={fecha}
              indexNoche={i + 1}
              fechaCheckIn={fecha}
              fechaCheckOut={hoteles[0]?.fechaCheckOut?.substring(0, 10) ?? fecha}
              hoteles={hoteles}
              query={q}
              matches={matches}
              locale={locale}
              t={t}
              hotelesEnlazables={hotelesEnlazables}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface HotelEnlazable {
  id: number;
  nombre: string;
  lat: number | null;
  lng: number | null;
  ciudad: string | null;
}

function NocheGroup({
  indexNoche,
  fechaCheckIn,
  fechaCheckOut,
  hoteles,
  query,
  matches,
  locale,
  t,
  hotelesEnlazables,
}: {
  indexNoche: number;
  fechaCheckIn: string;
  fechaCheckOut: string;
  hoteles: GranEventoAlojamiento[];
  query: string;
  matches: (s: string) => boolean;
  locale: string;
  t: (k: string, params?: Record<string, string | number>) => string;
  hotelesEnlazables: HotelEnlazable[];
}) {
  const dateRangeLabel = formatDateRange(fechaCheckIn, fechaCheckOut, locale);
  const noches = countNights(fechaCheckIn, fechaCheckOut);

  return (
    <div>
      <div className="mb-5 flex items-baseline gap-3 border-b border-stone-200 pb-3">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-700">
          {noches > 1
            ? t('nochesRange', { desde: indexNoche, hasta: indexNoche + noches - 1 })
            : t('nocheNum', { n: indexNoche })}
        </p>
        <p className="text-sm font-semibold text-stone-700">{dateRangeLabel}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {hoteles.map((h) => (
          <HotelCard
            key={h.id}
            hotel={h}
            query={query}
            matches={matches}
            locale={locale}
            t={t}
            hotelesEnlazables={hotelesEnlazables}
          />
        ))}
      </div>
    </div>
  );
}

function HotelCard({
  hotel,
  query,
  matches,
  locale,
  t,
  hotelesEnlazables,
}: {
  hotel: GranEventoAlojamiento;
  query: string;
  matches: (s: string) => boolean;
  locale: string;
  t: (k: string, params?: Record<string, string | number>) => string;
  hotelesEnlazables: HotelEnlazable[];
}) {
  const notas = pickI18n(hotel.notas_es, hotel.notas_i18n, locale);
  const asignacionesAgrupadas = groupByDelegacion(hotel.asignaciones);

  // Filtrado: si hay query, ocultamos hoteles que no matcheen ni en su nombre
  // ni en ninguna asignación.
  const matchedAsignaciones = query
    ? asignacionesAgrupadas
        .map(([deleg, personas]) => {
          if (matches(deleg) || matches(hotel.nombre) || (hotel.ciudad && matches(hotel.ciudad))) {
            return [deleg, personas] as const;
          }
          const filteredPersonas = personas.filter((p) => matches(p.persona) || matches(p.delegacion));
          return filteredPersonas.length > 0 ? ([deleg, filteredPersonas] as const) : null;
        })
        .filter(Boolean) as Array<readonly [string, typeof hotel.asignaciones]>
    : asignacionesAgrupadas;

  const hotelMatches =
    !query ||
    matches(hotel.nombre) ||
    (hotel.ciudad && matches(hotel.ciudad)) ||
    matchedAsignaciones.length > 0 ||
    hotel.paraTodos;

  if (!hotelMatches) return null;

  const mapsUrl =
    hotel.lat != null && hotel.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${hotel.lat},${hotel.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${hotel.nombre} ${hotel.ciudad ?? ''}`.trim(),
        )}`;

  if (hotel.pendiente) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-5">
        <div className="flex items-center gap-2 text-amber-800">
          <Hourglass className="h-5 w-5" />
          <h3 className="text-base font-bold">{t('pendienteTitulo')}</h3>
        </div>
        <p className="mt-2 text-sm text-stone-700">{t('pendienteDescripcion')}</p>
        {hotel.asignaciones.length > 0 ? (
          <ul className="mt-3 space-y-1 text-sm text-stone-700">
            {hotel.asignaciones.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold">{a.persona}</span>
                <span className="text-xs text-stone-500">· {a.delegacion}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
      {hotel.fotoUrl ? (
        <div className="relative h-40 w-full bg-stone-100">
          <Image src={hotel.fotoUrl} alt={hotel.nombre} fill style={{ objectFit: 'cover' }} sizes="(max-width: 1024px) 100vw, 50vw" />
        </div>
      ) : null}
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <BedDouble className="h-4 w-4 text-amber-700" />
          <h3 className="text-base font-bold text-stone-900 sm:text-lg">{hotel.nombre}</h3>
          {hotel.paraTodos ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
              {t('paraTodos')}
            </span>
          ) : null}
        </div>
        {hotel.ciudad ? <p className="mt-0.5 text-xs text-stone-500">{hotel.ciudad}</p> : null}
        {hotel.direccion ? <p className="mt-1 text-sm text-stone-600">{hotel.direccion}</p> : null}
        {notas ? (
          <div className="mt-3 flex items-start gap-2 rounded-xl border-l-4 border-amber-500 bg-amber-50 px-3 py-2.5 shadow-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
            <p className="text-sm font-semibold leading-snug text-amber-900">
              <NotaConEnlaces texto={notas} hotelActualId={hotel.id} hoteles={hotelesEnlazables} />
            </p>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-800"
          >
            <MapPin className="h-3.5 w-3.5" />
            {t('comoLlegar')}
          </a>
          {hotel.telefono ? (
            <a
              href={`tel:${hotel.telefono.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-amber-400 hover:text-amber-800"
            >
              <Phone className="h-3.5 w-3.5" />
              {hotel.telefono}
            </a>
          ) : null}
          {hotel.web ? (
            <a
              href={hotel.web}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-amber-400 hover:text-amber-800"
            >
              <Globe className="h-3.5 w-3.5" />
              {t('web')}
            </a>
          ) : null}
        </div>

        {hotel.paraTodos ? (
          <p className="mt-4 text-sm font-medium text-emerald-800">{t('paraTodosDescripcion')}</p>
        ) : matchedAsignaciones.length > 0 ? (
          <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
            {matchedAsignaciones.map(([deleg, personas]) => (
              <div key={deleg}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-orange-700">{deleg}</p>
                <ul className="mt-1 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                  {personas.map((a) => (
                    <li
                      key={a.id}
                      className={`text-sm text-stone-800 ${query && matches(a.persona) ? 'rounded bg-amber-100 px-1' : ''}`}
                    >
                      {a.persona}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : query ? null : (
          <p className="mt-4 text-sm text-stone-500">{t('sinAsignaciones')}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Renderiza el texto de una nota detectando menciones a otros hoteles del
 * mismo evento y convirtiéndolas en enlaces a Google Maps con sus
 * coordenadas. Útil para notas tipo "se desayuna en el Hotel X".
 *
 * - Funciona en cualquier idioma (los nombres propios no se traducen).
 * - No se enlaza el propio hotel (no tiene sentido).
 * - Hace match case-insensitive con el `nombre` exacto del hotel; si no
 *   se encuentra, intenta un match parcial removiendo la palabra "Hotel"
 *   delante o detrás (variaciones de redacción habituales).
 */
function NotaConEnlaces({
  texto,
  hotelActualId,
  hoteles,
}: {
  texto: string;
  hotelActualId: number;
  hoteles: HotelEnlazable[];
}) {
  const candidatos = hoteles.filter((h) => h.id !== hotelActualId);
  if (candidatos.length === 0) return <>{texto}</>;

  const matches: Array<{ start: number; end: number; hotel: HotelEnlazable }> = [];
  for (const h of candidatos) {
    const variantes = uniq([
      h.nombre,
      h.nombre.replace(/^Hotel\s+/i, ''),
      `Hotel ${h.nombre.replace(/^Hotel\s+/i, '')}`,
    ]);
    for (const v of variantes) {
      const re = new RegExp(escapeRegex(v), 'gi');
      let m: RegExpExecArray | null;
      while ((m = re.exec(texto)) !== null) {
        const start = m.index;
        const end = m.index + m[0].length;
        if (matches.some((x) => start < x.end && end > x.start)) continue;
        matches.push({ start, end, hotel: h });
      }
    }
  }

  if (matches.length === 0) return <>{texto}</>;

  matches.sort((a, b) => a.start - b.start);

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (m.start > cursor) parts.push(texto.slice(cursor, m.start));
    const label = texto.slice(m.start, m.end);
    const url =
      m.hotel.lat != null && m.hotel.lng != null
        ? `https://www.google.com/maps/search/?api=1&query=${m.hotel.lat},${m.hotel.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${m.hotel.nombre} ${m.hotel.ciudad ?? ''}`.trim(),
          )}`;
    parts.push(
      <a
        key={`l-${i}-${m.start}`}
        href={url}
        target="_blank"
        rel="noopener"
        className="inline-flex items-baseline gap-0.5 underline decoration-amber-600 decoration-2 underline-offset-2 hover:text-amber-700"
      >
        <MapPin className="h-3 w-3 self-center text-amber-700" />
        {label}
      </a>,
    );
    cursor = m.end;
  }
  if (cursor < texto.length) parts.push(texto.slice(cursor));
  return <>{parts}</>;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function groupByDelegacion(
  asignaciones: GranEventoAlojamiento['asignaciones'],
): Array<readonly [string, GranEventoAlojamiento['asignaciones']]> {
  const map = new Map<string, GranEventoAlojamiento['asignaciones']>();
  for (const a of asignaciones) {
    const arr = map.get(a.delegacion) ?? [];
    arr.push(a);
    map.set(a.delegacion, arr);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function formatDateRange(start: string, end: string, locale: string): string {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' });
    return `${fmt.format(s)} → ${fmt.format(e)}`;
  } catch {
    return `${start} → ${end}`;
  }
}

function countNights(start: string, end: string): number {
  try {
    const s = new Date(start);
    const e = new Date(end);
    return Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
  } catch {
    return 1;
  }
}
