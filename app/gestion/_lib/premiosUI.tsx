'use client';

import {
  Star,
  MapPin,
  Globe,
  Ticket,
  Plane,
  Rocket,
  Hammer,
  Store,
  Users,
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export interface PremioUI {
  titulo: string;
  descripcion: string;
  unidad: string;
  implementado: boolean;
  Icon: LucideIcon;
  /** Paleta consistente para el card. Usamos tailwind con clases completas. */
  tint: {
    border: string;
    bg: string;
    iconBg: string;
    pill: string;
  };
}

// Gradiente hero re-utilizado en todo /gestion.
export const HERO_GRADIENT =
  'linear-gradient(135deg, #a0705a 0%, #b8856d 40%, #c49a82 100%)';

// Paletas por premio — colores distintos pero compatibles con el hero marrón.
const PALETAS: Array<PremioUI['tint']> = [
  // amber
  {
    border: 'border-amber-200/80',
    bg: 'bg-gradient-to-b from-amber-50/60 to-white dark:from-amber-950/30 dark:to-card',
    iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-200',
    pill: 'bg-amber-100 text-amber-800 ring-amber-200',
  },
  // blue
  {
    border: 'border-blue-200/80',
    bg: 'bg-gradient-to-b from-blue-50/60 to-white dark:from-blue-950/30 dark:to-card',
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200',
    pill: 'bg-blue-100 text-blue-800 ring-blue-200',
  },
  // sky
  {
    border: 'border-sky-200/80',
    bg: 'bg-gradient-to-b from-sky-50/60 to-white dark:from-sky-950/30 dark:to-card',
    iconBg: 'bg-gradient-to-br from-sky-500 to-sky-600 shadow-sky-200',
    pill: 'bg-sky-100 text-sky-800 ring-sky-200',
  },
  // rose
  {
    border: 'border-rose-200/80',
    bg: 'bg-gradient-to-b from-rose-50/60 to-white dark:from-rose-950/30 dark:to-card',
    iconBg: 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-200',
    pill: 'bg-rose-100 text-rose-800 ring-rose-200',
  },
  // indigo
  {
    border: 'border-indigo-200/80',
    bg: 'bg-gradient-to-b from-indigo-50/60 to-white dark:from-indigo-950/30 dark:to-card',
    iconBg: 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-indigo-200',
    pill: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
  },
  // orange
  {
    border: 'border-orange-200/80',
    bg: 'bg-gradient-to-b from-orange-50/60 to-white dark:from-orange-950/30 dark:to-card',
    iconBg: 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-orange-200',
    pill: 'bg-orange-100 text-orange-800 ring-orange-200',
  },
  // emerald
  {
    border: 'border-emerald-200/80',
    bg: 'bg-gradient-to-b from-emerald-50/60 to-white dark:from-emerald-950/30 dark:to-card',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-200',
    pill: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  },
  // teal
  {
    border: 'border-teal-200/80',
    bg: 'bg-gradient-to-b from-teal-50/60 to-white dark:from-teal-950/30 dark:to-card',
    iconBg: 'bg-gradient-to-br from-teal-500 to-teal-600 shadow-teal-200',
    pill: 'bg-teal-100 text-teal-800 ring-teal-200',
  },
  // cyan
  {
    border: 'border-cyan-200/80',
    bg: 'bg-gradient-to-b from-cyan-50/60 to-white dark:from-cyan-950/30 dark:to-card',
    iconBg: 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-cyan-200',
    pill: 'bg-cyan-100 text-cyan-800 ring-cyan-200',
  },
  // lime
  {
    border: 'border-lime-200/80',
    bg: 'bg-gradient-to-b from-lime-50/60 to-white dark:from-lime-950/30 dark:to-card',
    iconBg: 'bg-gradient-to-br from-lime-500 to-lime-600 shadow-lime-200',
    pill: 'bg-lime-100 text-lime-800 ring-lime-200',
  },
  // fuchsia
  {
    border: 'border-fuchsia-200/80',
    bg: 'bg-gradient-to-b from-fuchsia-50/60 to-white dark:from-fuchsia-950/30 dark:to-card',
    iconBg: 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 shadow-fuchsia-200',
    pill: 'bg-fuchsia-100 text-fuchsia-800 ring-fuchsia-200',
  },
  // violet
  {
    border: 'border-violet-200/80',
    bg: 'bg-gradient-to-b from-violet-50/60 to-white dark:from-violet-950/30 dark:to-card',
    iconBg: 'bg-gradient-to-br from-violet-500 to-violet-600 shadow-violet-200',
    pill: 'bg-violet-100 text-violet-800 ring-violet-200',
  },
];

export const PREMIOS_UI: Record<number, PremioUI> = {
  1: {
    titulo: 'Pueblo Mejor Valorado',
    descripcion:
      'Se muestra tu media real (★), pero el ranking usa una media ponderada con la media de la red para que no gane un pueblo con 3 votos perfectos frente a otro con 150. Cuantas más valoraciones acumules, más se acerca tu score a tu media real.',
    unidad: '★ de 5',
    implementado: true,
    Icon: Star,
    tint: PALETAS[0],
  },
  2: {
    titulo: 'Más Visitado',
    descripcion:
      'Visitas totales al pueblo (detectadas por la app y registradas manualmente).',
    unidad: 'visitas',
    implementado: true,
    Icon: MapPin,
    tint: PALETAS[1],
  },
  3: {
    titulo: 'Más Visitado · Web y App',
    descripcion: 'Pueblo con más páginas vistas y consultas en la web/app.',
    unidad: 'vistas',
    implementado: true,
    Icon: Globe,
    tint: PALETAS[2],
  },
  4: {
    titulo: 'Más Activo del Club',
    descripcion: 'Mayor número de canjes de QR del Club de Amigos.',
    unidad: 'canjes',
    implementado: true,
    Icon: Ticket,
    tint: PALETAS[3],
  },
  5: {
    titulo: 'Más Internacional',
    descripcion: '% de visitantes extranjeros (datos Telefónica Tech, anual).',
    unidad: '%',
    implementado: false,
    Icon: Plane,
    tint: PALETAS[4],
  },
  6: {
    titulo: 'Pueblo Revelación',
    descripcion:
      'Mayor crecimiento relativo en visitas totales (GPS + manuales), canjes del Club y visitas en web/app respecto al periodo anterior.',
    unidad: '%',
    implementado: true,
    Icon: Rocket,
    tint: PALETAS[5],
  },
  7: {
    titulo: 'Pueblo Más Trabajador',
    descripcion:
      'Eventos + noticias + páginas + POIs + documentos compartidos con la red + multiexperiencias y paradas (lo que haga un ADMIN no cuenta; las multiexperiencias cuentan desde el 1-mar-2026).',
    unidad: 'aportaciones',
    implementado: true,
    Icon: Hammer,
    tint: PALETAS[6],
  },
  // NOTA: los slots 8 y 9 están RESERVADOS. Los 12 premios se quedan en 10
  // hasta que se defina un nuevo criterio: no se calculan ni se muestran.
  10: {
    titulo: 'Mejor Tejido Local',
    descripcion:
      'Recursos turísticos propios del pueblo (monumentos, museos, iglesias, oficinas de turismo…) + negocios adheridos al Club con plan de pago (hoteles, casas rurales, restaurantes, tiendas).',
    unidad: 'recursos + negocios',
    implementado: true,
    Icon: Store,
    tint: PALETAS[7],
  },
  11: {
    titulo: 'Más Visitado por el Club',
    descripcion:
      'Visitas del Club ponderadas por nº de recursos del pueblo (para no penalizar a los pequeños).',
    unidad: 'vis/recurso',
    implementado: true,
    Icon: Users,
    tint: PALETAS[8],
  },
  12: {
    titulo: 'Especial del Jurado',
    descripcion: 'Decisión discrecional del jurado por iniciativas singulares.',
    unidad: 'manual',
    implementado: true,
    Icon: Crown,
    tint: PALETAS[9],
  },
};

// IDs de los 10 premios activos (tras reservar los slots 8 y 9).
export const PREMIOS_IDS_VISIBLES = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];

// ——— Formato de valores por premio ————————————————————————————————————
export function formatValor(premioId: number, valor: number | null): string {
  if (valor == null) return '—';
  if (premioId === 1) return valor.toFixed(2) + ' ★';
  if (premioId === 6) return (valor >= 0 ? '+' : '') + valor.toFixed(1) + '%';
  if (premioId === 11) return valor.toFixed(2) + ' vis/rec';
  if (premioId === 7) {
    const txt = Number.isInteger(valor)
      ? valor.toLocaleString('es-ES')
      : valor.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${txt} pt${valor === 1 ? '' : 's'}`;
  }
  return Math.round(valor).toLocaleString('es-ES');
}

// ——— Tendencia (↑↓=new) reutilizable ——————————————————————————————————
export type Tendencia = 'up' | 'down' | 'same' | 'new' | null | undefined;

export function TrendBadge({
  t,
  prev,
  compact = false,
  labelRef,
}: {
  t?: Tendencia;
  prev?: number | null;
  compact?: boolean;
  /** Etiqueta textual del periodo de referencia (p.ej. "hace 7 días" o "ventana anterior"). */
  labelRef?: string;
}) {
  if (!t) return null;
  const base =
    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1';
  const ref = labelRef ?? 'antes';
  if (t === 'up')
    return (
      <span
        title={prev ? `${ref}: ${prev}ª` : `Sube respecto a ${ref}`}
        className={`${base} bg-emerald-50 text-emerald-700 ring-emerald-200`}
      >
        <TrendingUp className="h-3 w-3" />
        {compact ? '' : prev ? `desde ${prev}ª` : 'sube'}
      </span>
    );
  if (t === 'down')
    return (
      <span
        title={prev ? `${ref}: ${prev}ª` : `Baja respecto a ${ref}`}
        className={`${base} bg-rose-50 text-rose-700 ring-rose-200`}
      >
        <TrendingDown className="h-3 w-3" />
        {compact ? '' : prev ? `desde ${prev}ª` : 'baja'}
      </span>
    );
  if (t === 'same')
    return (
      <span
        title={prev ? `${ref}: ${prev}ª (sin cambios)` : `Se mantiene respecto a ${ref}`}
        className={`${base} bg-muted text-muted-foreground ring-border`}
      >
        <Minus className="h-3 w-3" />
        {compact ? '' : 'igual'}
      </span>
    );
  return (
    <span
      title={`No estaba en el ranking ${ref}`}
      className={`${base} bg-sky-50 text-sky-700 ring-sky-200`}
    >
      <Sparkles className="h-3 w-3" />
      {compact ? '' : 'nuevo'}
    </span>
  );
}
