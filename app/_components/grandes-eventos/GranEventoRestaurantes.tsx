'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { UtensilsCrossed, Moon, MapPin, Phone, Globe, Clock, CalendarDays } from 'lucide-react';
import type { GranEventoRestaurante } from '@/lib/grandes-eventos';
import { pickI18n } from '@/lib/grandes-eventos';

function formatFecha(fecha: string, locale: string): string {
  try {
    const d = new Date(`${fecha.slice(0, 10)}T12:00:00Z`);
    return d.toLocaleDateString(locale === 'ca' ? 'ca' : locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  } catch {
    return fecha.slice(0, 10);
  }
}

function agruparPorFecha(
  restaurantes: GranEventoRestaurante[],
): { fecha: string; restaurantes: GranEventoRestaurante[] }[] {
  const map = new Map<string, GranEventoRestaurante[]>();
  for (const r of restaurantes) {
    // Usa la fecha del restaurante si existe, si no "sin-fecha"
    const key = r.fecha ? r.fecha.slice(0, 10) : 'sin-fecha';
    const arr = map.get(key) ?? [];
    arr.push(r);
    map.set(key, arr);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, restaurantes]) => ({ fecha, restaurantes }));
}

export default function GranEventoRestaurantes({
  restaurantes,
}: {
  restaurantes: GranEventoRestaurante[];
}) {
  const locale = useLocale();
  const t = useTranslations('granEvento.restaurantes');

  const grupos = agruparPorFecha(restaurantes);

  return (
    <section
      id="restaurantes"
      className="border-t border-stone-100 bg-gradient-to-br from-emerald-50/30 via-stone-50/60 to-amber-50/30 px-6 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-5xl">
        {/* Cabecera */}
        <div className="mb-10 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700/80">
            {t('kicker')}
          </p>
          <div className="mt-3 mb-3 inline-flex h-1 w-12 rounded-full bg-amber-700" />
          <h2 className="text-2xl font-bold text-stone-900 sm:text-3xl">{t('titulo')}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-stone-600 sm:text-base">{t('intro')}</p>
        </div>

        {/* Estado vacío */}
        {restaurantes.length === 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50/40 px-6 py-8 text-amber-800">
            <UtensilsCrossed className="h-6 w-6 shrink-0 opacity-50" />
            <p className="text-sm font-medium">{t('proximamente')}</p>
          </div>
        )}

        {/* Grupos por día */}
        <div className="space-y-12">
          {grupos.map(({ fecha, restaurantes: rests }) => (
            <div key={fecha}>
              {/* Etiqueta del día */}
              <div className="mb-5 flex items-center gap-3 border-b border-stone-200 pb-3">
                <CalendarDays className="h-5 w-5 shrink-0 text-amber-700" />
                <p className="text-lg font-bold capitalize text-stone-900">
                  {fecha === 'sin-fecha' ? t('sinFecha') : formatFecha(fecha, locale)}
                </p>
              </div>

              {/* Tarjetas */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {rests.map((r) => (
                  <RestauranteCard key={r.id} restaurante={r} locale={locale} t={t} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RestauranteCard({
  restaurante: r,
  locale,
  t,
}: {
  restaurante: GranEventoRestaurante;
  locale: string;
  t: (k: string) => string;
}) {
  const notas = pickI18n(r.notas_es, r.notas_i18n, locale);

  const mapsUrl =
    r.lat != null && r.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${r.nombre} ${r.ciudad ?? ''}`.trim(),
        )}`;

  const isComida = r.tipo === 'comida';
  const isCena = r.tipo === 'cena';

  return (
    <div
      id={`restaurante-${r.id}`}
      className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
    >
      {/* Foto */}
      {r.fotoUrl ? (
        <div className="relative h-44 w-full overflow-hidden bg-stone-100">
          <Image
            src={r.fotoUrl}
            alt={r.nombre}
            fill
            style={{ objectFit: 'cover' }}
            sizes="(max-width: 640px) 100vw, 50vw"
            className="transition duration-500 group-hover:scale-105"
          />
          {/* Badges superpuestos sobre la foto */}
          <div className="absolute left-3 top-3 flex gap-2">
            {isComida && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-600/90 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                <UtensilsCrossed className="h-3 w-3" />
                {t('comida')}
              </span>
            )}
            {isCena && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-700/90 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                <Moon className="h-3 w-3" />
                {t('cena')}
              </span>
            )}
            {r.hora && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                <Clock className="h-3 w-3" />
                {r.hora}
              </span>
            )}
          </div>
        </div>
      ) : null}

      <div className="p-5">
        {/* Badges (si no hay foto) */}
        {!r.fotoUrl && (isComida || isCena || r.hora) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {isComida && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                <UtensilsCrossed className="h-3 w-3" />
                {t('comida')}
              </span>
            )}
            {isCena && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-800">
                <Moon className="h-3 w-3" />
                {t('cena')}
              </span>
            )}
            {r.hora && (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700">
                <Clock className="h-3 w-3" />
                {r.hora}
              </span>
            )}
          </div>
        )}

        {/* Nombre y ciudad */}
        <h3 className="text-lg font-bold leading-tight text-stone-900">{r.nombre}</h3>
        {r.ciudad && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
            <MapPin className="h-3 w-3" />
            {r.ciudad}
          </p>
        )}
        {r.direccion && (
          <p className="mt-1 text-sm text-stone-600">{r.direccion}</p>
        )}
        {notas && (
          <p className="mt-2 text-sm italic leading-relaxed text-stone-600">{notas}</p>
        )}

        {/* Botones de acción */}
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-700 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-800 active:scale-95"
          >
            <MapPin className="h-3.5 w-3.5" />
            {t('comoLlegar')}
          </a>
          {r.telefono && (
            <a
              href={`tel:${r.telefono.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:border-amber-400 hover:text-amber-800 active:scale-95"
            >
              <Phone className="h-3.5 w-3.5" />
              {r.telefono}
            </a>
          )}
          {r.web && (
            <a
              href={r.web}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:border-amber-400 hover:text-amber-800 active:scale-95"
            >
              <Globe className="h-3.5 w-3.5" />
              {t('web')}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
