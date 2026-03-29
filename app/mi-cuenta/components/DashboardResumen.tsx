'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import NivelIcono from './NivelIcono';
import { Headline, Caption } from '@/app/components/ui/typography';

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
};

export default function DashboardResumen({
  nivelActual,
  siguienteNivel,
  puntosTotales,
  puntosCanjeables,
  puntosNoCanjeables,
  progreso,
}: Props) {
  const t = useTranslations('points');
  const nombreNivel = nivelActual?.nombre ?? t('initialLevel');

  return (
    <section className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <NivelIcono nombreNivel={nombreNivel} className="shrink-0" />
        <div>
          <Headline as="h1" className="mb-0.5">{t('myAccount')}</Headline>
          <Caption>{nombreNivel}</Caption>
        </div>
      </div>

      {/* Total desglosado */}
      <div className="space-y-3">
        <p className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
          {puntosTotales} {t('pointsLabel')}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
              <path d="M8 0a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 4.095 0 5.555 0 7.318 0 9.366 1.708 11 3.781 11H7.5V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11h4.188C14.502 11 16 9.57 16 7.773c0-1.636-1.242-2.969-2.834-3.194C12.923 1.999 10.69 0 8 0z" />
            </svg>
            {puntosCanjeables} {t('gpsPoints')}
          </span>
          <span className="text-muted-foreground">+</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
              <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
            </svg>
            {puntosNoCanjeables} {t('manualPoints')}
          </span>
          <span className="text-muted-foreground">=</span>
          <span className="font-semibold">{puntosTotales} {t('totalPoints')}</span>
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

      {/* Barra de progreso */}
      <div className="space-y-2">
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progreso))}%` }}
          />
        </div>

        {siguienteNivel ? (
          <Caption>
            {t('nextLevel')} {siguienteNivel.nombre} (
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
    </section>
  );
}
