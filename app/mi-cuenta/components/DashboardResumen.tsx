'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import NivelIcono, { NIVEL_AVATAR_SRC } from './NivelIcono';
import { Headline, Caption } from '@/app/components/ui/typography';

const NIVEL_SLUG: Record<string, string> = {
  'Turista Curioso': 'turistaCurioso',
  'Explorador Local': 'exploradorLocal',
  'Viajero Apasionado': 'viajeroApasionado',
  'Amante de los Pueblos': 'amantePueblos',
  'Gran Viajero': 'granViajero',
  'Leyenda LPBE': 'leyendaLpbe',
  'Embajador de los Pueblos': 'embajadorPueblos',
  'Maestro Viajero': 'maestroViajero',
  'Gran Maestre de los Pueblos': 'granMaestre',
};

type Nivel = {
  nombre: string;
  nivel: number;
};

type SiguienteNivel = {
  nombre: string;
  nivel: number;
  puntos_necesarios: number;
};

type Props = {
  nivelActual?: Nivel | null;
  siguienteNivel?: SiguienteNivel | null;
  puntosTotales: number;
  puntosCanjeables: number;
  puntosNoCanjeables: number;
  progreso: number;
  posicionGps?: number;
  posicionTotal?: number;
};

export default function DashboardResumen({
  nivelActual,
  siguienteNivel,
  puntosTotales,
  puntosCanjeables,
  puntosNoCanjeables,
  progreso,
  posicionGps,
  posicionTotal,
}: Props) {
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const t = useTranslations('points');
  const tl = useTranslations('levels');
  const translateNivel = (nombre: string) => {
    const slug = NIVEL_SLUG[nombre];
    return slug ? tl(slug) : nombre;
  };
  const nombreNivel = nivelActual?.nombre ? translateNivel(nivelActual.nombre) : t('initialLevel');
  const avatarSrc = NIVEL_AVATAR_SRC[nivelActual?.nombre ?? ''] ?? NIVEL_AVATAR_SRC['Turista Curioso'];

  return (
    <section className="space-y-6 rounded-2xl border border-border/80 bg-gradient-to-br from-white via-card to-card p-6 shadow-sm dark:from-card dark:via-card dark:to-card">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="mx-auto md:mx-0">
          <button
            type="button"
            onClick={() => setShowAvatarModal(true)}
            className="rounded-2xl transition-transform hover:scale-[1.02]"
          >
            <NivelIcono
              nombreNivel={nombreNivel}
              className="h-32 w-32 md:h-36 md:w-36"
              imgClassName="scale-105"
            />
          </button>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-950/70 dark:text-amber-200">
            {t('myAccount')}
          </span>
          <Headline as="h1" className="mb-0.5">
            {nombreNivel}
          </Headline>
          <Caption>{t('pointsLabel')}</Caption>
        </div>
      </div>

      {/* Total desglosado */}
      <div className="space-y-4">
        <p className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
          {puntosTotales} {t('pointsLabel')}
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              {t('gpsPoints')}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-800 dark:text-emerald-200">
              {puntosCanjeables}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
              {t('manualPoints')}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-800 dark:text-amber-200">
              {puntosNoCanjeables}
            </p>
          </div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {t('totalPoints')}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">
              {puntosTotales}
            </p>
          </div>
        </div>

        {puntosCanjeables > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M16.403 12.652a3 3 0 0 0 0-5.304 3 3 0 0 0-3.75-3.751 3 3 0 0 0-5.305 0 3 3 0 0 0-3.751 3.75 3 3 0 0 0 0 5.305 3 3 0 0 0 3.75 3.751 3 3 0 0 0 5.305 0 3 3 0 0 0 3.751-3.75Zm-2.546-4.46a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
            </svg>
            {t('redeemableNote')}
          </p>
        )}
      </div>

      {(posicionGps || posicionTotal) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {posicionGps ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              {t('gpsRankLabel')}: {posicionGps}
            </span>
          ) : null}
          {posicionTotal ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
              {t('totalRankLabel')}: {posicionTotal}
            </span>
          ) : null}
        </div>
      )}

      {/* Barra de progreso */}
      <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progreso))}%` }}
          />
        </div>

        {siguienteNivel ? (
          <Caption>
            {t('nextLevel')} {translateNivel(siguienteNivel.nombre)} (
            {siguienteNivel.puntos_necesarios} {t('pointsNeeded')})
          </Caption>
        ) : (
          <Caption>
            {t('startVisiting')}
          </Caption>
        )}
      </div>

      {/* Link to levels page */}
      <Link
        href="/mi-cuenta/niveles"
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:border-primary/30"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-primary">
          <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
        </svg>
        {t('viewAllLevels')}
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 ml-auto">
          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
        </svg>
      </Link>

      {showAvatarModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setShowAvatarModal(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl border border-white/30 bg-black/20 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={avatarSrc}
              alt={nombreNivel}
              className="max-h-[80vh] max-w-[80vw] object-contain"
            />
            <button
              type="button"
              onClick={() => setShowAvatarModal(false)}
              className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white hover:bg-black/90"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
