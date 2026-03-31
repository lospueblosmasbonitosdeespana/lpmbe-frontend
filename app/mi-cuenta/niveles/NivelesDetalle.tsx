'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import NivelIcono from '../components/NivelIcono';
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
  umbral: number;
  dinamico?: boolean;
};

type Props = {
  niveles: Nivel[];
  puntosTotales: number;
};

export default function NivelesDetalle({ niveles, puntosTotales }: Props) {
  const t = useTranslations('levels');
  const translateNivel = (nombre: string) => {
    const slug = NIVEL_SLUG[nombre];
    return slug ? t(slug) : nombre;
  };

  const nivelActualIdx = (() => {
    let idx = 0;
    for (let i = niveles.length - 1; i >= 0; i--) {
      if (puntosTotales >= niveles[i].umbral) {
        idx = i;
        break;
      }
    }
    return idx;
  })();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Link
          href="/mi-cuenta/puntos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {t('backToPoints')}
        </Link>
        <Headline as="h1">{t('title')}</Headline>
        <p className="text-muted-foreground max-w-2xl">
          {t('description')}
        </p>
      </div>

      {/* How it works */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
        <Headline as="h2" className="text-lg">{t('howItWorks')}</Headline>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950 p-4 space-y-1">
            <p className="font-medium text-emerald-700 dark:text-emerald-300">{t('gpsVisitsTitle')}</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{t('gpsVisitsDesc')}</p>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950 p-4 space-y-1">
            <p className="font-medium text-amber-700 dark:text-amber-300">{t('manualVisitsTitle')}</p>
            <p className="text-sm text-amber-600 dark:text-amber-400">{t('manualVisitsDesc')}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('allPointsCount')}
        </p>
      </section>

      {/* Levels list */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
        <Headline as="h2" className="text-lg">{t('allLevels')}</Headline>

        <div className="space-y-3">
          {niveles.map((nivel, idx) => {
            const isActual = idx === nivelActualIdx;
            const isCompleted = idx < nivelActualIdx;
            const isLocked = idx > nivelActualIdx;

            return (
              <div
                key={nivel.nombre}
                className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                  isActual
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                    : isCompleted
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
                      : 'border-border bg-muted/30 opacity-60'
                }`}
              >
                <div className={`shrink-0 ${isLocked ? 'grayscale opacity-40' : ''}`}>
                  <NivelIcono nombreNivel={nivel.nombre} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{translateNivel(nivel.nombre)}</p>
                    {isActual && (
                      <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                        {t('currentLevel')}
                      </span>
                    )}
                    {isCompleted && (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-emerald-500">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <Caption>
                    {nivel.dinamico
                      ? t('dynamicThreshold', { points: nivel.umbral })
                      : t('threshold', { points: nivel.umbral })
                    }
                  </Caption>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-lg font-semibold tabular-nums">
                    {nivel.umbral}
                  </p>
                  <Caption>{t('pointsAbbr')}</Caption>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Your status */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
        <Headline as="h2" className="text-lg">{t('yourStatus')}</Headline>
        <div className="flex items-center gap-4">
          <NivelIcono nombreNivel={niveles[nivelActualIdx]?.nombre ?? ''} />
          <div>
            <p className="font-medium text-lg">{translateNivel(niveles[nivelActualIdx]?.nombre ?? '')}</p>
            <Caption>
              {puntosTotales} {t('pointsTotal')}
              {nivelActualIdx < niveles.length - 1 && (
                <> — {t('pointsToNext', { points: niveles[nivelActualIdx + 1].umbral - puntosTotales, next: translateNivel(niveles[nivelActualIdx + 1].nombre) })}</>
              )}
            </Caption>
          </div>
        </div>
      </section>
    </div>
  );
}
