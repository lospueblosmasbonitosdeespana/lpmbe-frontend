'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import NivelIcono, { NIVEL_AVATAR_SRC } from '../components/NivelIcono';
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

type SelectedAvatar = {
  src: string;
  alt: string;
};

export default function NivelesDetalle({ niveles, puntosTotales }: Props) {
  const [selectedAvatar, setSelectedAvatar] = useState<SelectedAvatar | null>(null);
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
    <>
      <div className="space-y-8">
        <div className="space-y-2">
          <Link
            href="/mi-cuenta/puntos"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('backToPoints')}
          </Link>
          <Headline as="h1">{t('title')}</Headline>
          <p className="max-w-2xl text-muted-foreground">{t('description')}</p>
        </div>

        <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <Headline as="h2" className="text-lg">
            {t('howItWorks')}
          </Headline>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 rounded-lg bg-emerald-50 p-4 dark:bg-emerald-950">
              <p className="font-medium text-emerald-700 dark:text-emerald-300">
                {t('gpsVisitsTitle')}
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{t('gpsVisitsDesc')}</p>
            </div>
            <div className="space-y-1 rounded-lg bg-amber-50 p-4 dark:bg-amber-950">
              <p className="font-medium text-amber-700 dark:text-amber-300">
                {t('manualVisitsTitle')}
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {t('manualVisitsDesc')}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{t('allPointsCount')}</p>
        </section>

        <section className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <Headline as="h2" className="text-lg">
            {t('allLevels')}
          </Headline>

          <div className="space-y-3">
            {niveles.map((nivel, idx) => {
              const isActual = idx === nivelActualIdx;
              const isCompleted = idx < nivelActualIdx;
              const isLocked = idx > nivelActualIdx;
              const avatarSrc =
                NIVEL_AVATAR_SRC[nivel.nombre] ?? NIVEL_AVATAR_SRC['Turista Curioso'];
              const avatarAlt = translateNivel(nivel.nombre);

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
                  {isLocked ? (
                    <div className="shrink-0 grayscale opacity-40">
                      <NivelIcono nombreNivel={nivel.nombre} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedAvatar({ src: avatarSrc, alt: avatarAlt })}
                      className="shrink-0 rounded-2xl transition-transform hover:scale-[1.02]"
                    >
                      <NivelIcono nombreNivel={nivel.nombre} />
                    </button>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{avatarAlt}</p>
                      {isActual && (
                        <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                          {t('currentLevel')}
                        </span>
                      )}
                      {isCompleted && (
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-emerald-500">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <Caption>
                      {nivel.dinamico
                        ? t('dynamicThreshold', { points: nivel.umbral })
                        : t('threshold', { points: nivel.umbral })}
                    </Caption>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-lg font-semibold tabular-nums">{nivel.umbral}</p>
                    <Caption>{t('pointsAbbr')}</Caption>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-sm">
          <Headline as="h2" className="text-lg">
            {t('yourStatus')}
          </Headline>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() =>
                setSelectedAvatar({
                  src:
                    NIVEL_AVATAR_SRC[niveles[nivelActualIdx]?.nombre ?? ''] ??
                    NIVEL_AVATAR_SRC['Turista Curioso'],
                  alt: translateNivel(niveles[nivelActualIdx]?.nombre ?? ''),
                })
              }
              className="rounded-2xl transition-transform hover:scale-[1.02]"
            >
              <NivelIcono nombreNivel={niveles[nivelActualIdx]?.nombre ?? ''} />
            </button>
            <div>
              <p className="text-lg font-medium">
                {translateNivel(niveles[nivelActualIdx]?.nombre ?? '')}
              </p>
              <Caption>
                {puntosTotales} {t('pointsTotal')}
                {nivelActualIdx < niveles.length - 1 && (
                  <>
                    {' '}
                    -{' '}
                    {t('pointsToNext', {
                      points: niveles[nivelActualIdx + 1].umbral - puntosTotales,
                      next: translateNivel(niveles[nivelActualIdx + 1].nombre),
                    })}
                  </>
                )}
              </Caption>
            </div>
          </div>
        </section>
      </div>

      {selectedAvatar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-[3px]"
          onClick={() => setSelectedAvatar(null)}
        >
          <div
            className="relative flex max-h-[96vh] w-auto max-w-[99vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedAvatar(null)}
              aria-label="Close"
              className="absolute right-1 top-1 z-10 rounded-full border border-white/25 bg-black/70 px-2.5 py-1 text-sm font-semibold text-white hover:bg-black/90"
            >
              ×
            </button>
            <Image
              src={selectedAvatar.src}
              alt={selectedAvatar.alt}
              width={1800}
              height={1800}
              className="max-h-[94vh] w-auto max-w-[98vw] scale-[1.35] object-contain drop-shadow-[0_18px_36px_rgba(0,0,0,0.45)] md:scale-[1.45]"
              priority
            />
          </div>
        </div>
      )}
    </>
  );
}
