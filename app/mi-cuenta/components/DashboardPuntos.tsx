'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Title } from '@/app/components/ui/typography';

type PuebloPuntos = {
  puebloId: number;
  nombre: string;
  provincia: string;
  comunidad: string;
  puntos: number;
};

type Props = {
  puntosPorTipo?: {
    VISITA?: number;
    RUTA?: number;
    EVENTO?: number;
    MULTIEXPERIENCIA?: number;
  } | null;
  pueblosPuntos?: PuebloPuntos[];
};

export default function DashboardPuntos({ puntosPorTipo, pueblosPuntos = [] }: Props) {
  const t = useTranslations('points');
  const visita = puntosPorTipo?.VISITA ?? 0;
  const [open, setOpen] = useState(false);

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <Title size="lg">{t('pointsBreakdown')}</Title>

      <ul className="space-y-3">
        <li>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              {t('visits')}
              {pueblosPuntos.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({pueblosPuntos.length} pueblos)
                </span>
              )}
            </span>
            <span className="flex items-center gap-2">
              <span className="font-semibold tabular-nums">{visita}</span>
              <svg
                className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </span>
          </button>

          {open && pueblosPuntos.length > 0 && (
            <div className="mt-2 space-y-1 pl-2">
              {pueblosPuntos.map((p) => (
                <div
                  key={p.puebloId}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-foreground">{p.nombre}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {p.provincia}
                    </span>
                  </div>
                  <span className="ml-4 shrink-0 font-semibold tabular-nums text-primary">
                    {p.puntos} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </li>
      </ul>
    </section>
  );
}
