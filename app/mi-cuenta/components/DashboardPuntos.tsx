'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Title, Caption } from '@/app/components/ui/typography';

type CategoriaDesglose = {
  puntos: number;
  count: number;
  canjeable: boolean;
};

type Desglose = {
  visitasGPS: CategoriaDesglose;
  visitasManuales: CategoriaDesglose;
  clubRecurso: CategoriaDesglose;
  clubNegocio: CategoriaDesglose;
  compraTienda: CategoriaDesglose;
  logros: CategoriaDesglose;
};

type PuebloPuntos = {
  puebloId: number;
  nombre: string;
  provincia: string;
  comunidad: string;
  puntos: number;
  canjeable: boolean;
  origenVisita: string | null;
};

type Props = {
  desglose: Desglose;
  pueblosPuntos?: PuebloPuntos[];
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  );
}

function CanjeBadge({ canjeable }: { canjeable: boolean }) {
  const t = useTranslations('points');
  if (canjeable) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        {t('redeemable')}
      </span>
    );
  }
  return null;
}

function PuntosRow({
  label,
  countLabel,
  puntos,
  canjeable,
  children,
  defaultOpen = false,
}: {
  label: string;
  countLabel?: string;
  puntos: number;
  canjeable: boolean;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasChildren = !!children;

  if (puntos === 0) return null;

  return (
    <li>
      <button
        type="button"
        onClick={() => hasChildren && setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-lg px-4 py-3 transition-colors ${
          hasChildren ? 'bg-muted/50 hover:bg-muted cursor-pointer' : 'bg-muted/30'
        }`}
        disabled={!hasChildren}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          {label}
          {countLabel && (
            <span className="text-xs text-muted-foreground">({countLabel})</span>
          )}
          <CanjeBadge canjeable={canjeable} />
        </span>
        <span className="flex items-center gap-2">
          <span className="font-semibold tabular-nums">{puntos}</span>
          {hasChildren && <ChevronIcon open={open} />}
        </span>
      </button>
      {open && children}
    </li>
  );
}

export default function DashboardPuntos({ desglose, pueblosPuntos = [] }: Props) {
  const t = useTranslations('points');
  const gpsPueblos = pueblosPuntos.filter((p) => p.origenVisita === 'GPS');
  const manualPueblos = pueblosPuntos.filter((p) => p.origenVisita !== 'GPS');

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <Title size="lg">{t('pointsBreakdown')}</Title>

      <ul className="space-y-2">
        <PuntosRow
          label={t('visitsGPS')}
          countLabel={desglose.visitasGPS.count > 0 ? `${desglose.visitasGPS.count} ${t('villages')}` : undefined}
          puntos={desglose.visitasGPS.puntos}
          canjeable={true}
          defaultOpen={false}
        >
          {gpsPueblos.length > 0 && (
            <PueblosList pueblos={gpsPueblos} />
          )}
        </PuntosRow>

        <PuntosRow
          label={t('visitsManual')}
          countLabel={desglose.visitasManuales.count > 0 ? `${desglose.visitasManuales.count} ${t('villages')}` : undefined}
          puntos={desglose.visitasManuales.puntos}
          canjeable={false}
          defaultOpen={false}
        >
          {manualPueblos.length > 0 && (
            <PueblosList pueblos={manualPueblos} />
          )}
        </PuntosRow>

        <PuntosRow
          label={t('clubResources')}
          countLabel={desglose.clubRecurso.count > 0 ? `${desglose.clubRecurso.count}` : undefined}
          puntos={desglose.clubRecurso.puntos}
          canjeable={true}
        />

        <PuntosRow
          label={t('clubBusiness')}
          countLabel={desglose.clubNegocio.count > 0 ? `${desglose.clubNegocio.count}` : undefined}
          puntos={desglose.clubNegocio.puntos}
          canjeable={true}
        />

        <PuntosRow
          label={t('shopPurchases')}
          countLabel={desglose.compraTienda.count > 0 ? `${desglose.compraTienda.count}` : undefined}
          puntos={desglose.compraTienda.puntos}
          canjeable={true}
        />

        <PuntosRow
          label={t('achievements')}
          countLabel={desglose.logros.count > 0 ? `${desglose.logros.count}` : undefined}
          puntos={desglose.logros.puntos}
          canjeable={false}
        />
      </ul>
    </section>
  );
}

function PueblosList({ pueblos }: { pueblos: PuebloPuntos[] }) {
  return (
    <div className="mt-2 space-y-1 pl-2 max-w-lg">
      {pueblos.map((p) => (
        <div
          key={p.puebloId}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/30"
        >
          <span className="font-medium text-foreground">{p.nombre}</span>
          <span className="text-xs text-muted-foreground">{p.provincia}</span>
          <span className={`ml-auto font-semibold tabular-nums ${p.canjeable ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`}>
            {p.puntos} pts
          </span>
        </div>
      ))}
    </div>
  );
}
