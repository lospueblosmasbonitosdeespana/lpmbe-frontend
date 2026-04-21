'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import {
  Trophy,
  ArrowRight,
  Eye,
  MapPinned,
  Users,
  Smartphone,
  Star,
  Globe,
  Sparkles,
} from 'lucide-react';

type MetricasData = {
  pueblo: { id: number; nombre: string; slug: string };
  periodo: { dias: number; desde: string };
  ranking: {
    totalPueblos: number;
    visitasTotal: { posicion: number; valor: number; tendencia7d?: 'up' | 'down' | 'same' };
    visitasPeriodo: { posicion: number; valor: number; tendencia7d?: 'up' | 'down' | 'same' };
    visitasGps: { posicion: number; valor: number; tendencia7d?: 'up' | 'down' | 'same' };
    visitasManual: { posicion: number; valor: number; tendencia7d?: 'up' | 'down' | 'same' };
    visitasGpsMasManual: { posicion: number; valor: number; tendencia7d?: 'up' | 'down' | 'same' };
    visitasPeriodoGps: { posicion: number; valor: number; tendencia7d?: 'up' | 'down' | 'same' };
    visitasPeriodoManual: { posicion: number; valor: number; tendencia7d?: 'up' | 'down' | 'same' };
    visitantesUnicos: { posicion: number; valor: number; tendencia7d?: 'up' | 'down' | 'same' };
    valoracionesTotal: { posicion: number; valor: number; tendencia7d?: 'up' | 'down' | 'same' };
    valoracionesPeriodo: { posicion: number; valor: number; tendencia7d?: 'up' | 'down' | 'same' };
    valoracionesMedia: { posicion: number; valor: number; tendencia7d?: 'up' | 'down' | 'same' };
    webPageviews: { posicion: number; valor: number; tendencia7d?: 'up' | 'down' | 'same' };
  };
  visitas: {
    total: number;
    periodo: number;
    visitantesUnicos: number;
    gps: number;
    manual: number;
    porDia: Array<{ dia: string; total: number }>;
  };
  valoraciones: {
    total: number;
    periodo: number;
    media: number;
    distribucion: Record<number, number>;
    porDia: Array<{ dia: string; total: number }>;
  };
  web: {
    pageviews: number;
    pageviewsHistorico: number;
    pageviewsWeb: number;
    pageviewsApp: number;
    pageviewsPeriodoAnterior: number;
    crecimientoPct: number | null;
    sesionesUnicas: number;
    topPaginas: Array<{ path: string; total: number; web: number; app: number }>;
    porDia: Array<{ dia: string; total: number }>;
  };
};

const RATING_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

function KpiCard({
  label,
  value,
  sub,
  accent = 'default',
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'default' | 'visitas' | 'valoraciones' | 'web';
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const accentStyles: Record<string, { card: string; iconBg: string; ring: string }> = {
    default: {
      card: 'bg-card',
      iconBg: 'bg-gradient-to-br from-zinc-400 to-zinc-500',
      ring: 'ring-border',
    },
    visitas: {
      card: 'bg-gradient-to-b from-emerald-50/70 to-white dark:from-emerald-950/30 dark:to-card',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-200/60',
      ring: 'ring-emerald-200/70 dark:ring-emerald-900/50',
    },
    valoraciones: {
      card: 'bg-gradient-to-b from-amber-50/70 to-white dark:from-amber-950/30 dark:to-card',
      iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-200/60',
      ring: 'ring-amber-200/70 dark:ring-amber-900/50',
    },
    web: {
      card: 'bg-gradient-to-b from-blue-50/70 to-white dark:from-blue-950/30 dark:to-card',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200/60',
      ring: 'ring-blue-200/70 dark:ring-blue-900/50',
    },
  };
  const style = accentStyles[accent];
  return (
    <div
      className={`rounded-2xl border border-transparent p-4 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg ring-1 ${style.ring} ${style.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-3xl font-black tabular-nums text-foreground">
            {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
          </p>
        </div>
        {Icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md ${style.iconBg}`}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
      {sub && <p className="mt-2 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function formatDay(d: string) {
  const parts = d.split('-');
  return `${parts[2]}/${parts[1]}`;
}

function RankingTendenciaIcon({ tendencia }: { tendencia: 'up' | 'down' | 'same' }) {
  if (tendencia === 'up') {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-md bg-emerald-100 p-1.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
        title="Mejor posición que hace 7 días (número más bajo)"
        aria-label="Mejor posición que hace 7 días"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
          <path d="M12 19V5M12 5l-7 7M12 5l7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (tendencia === 'down') {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-md bg-red-100 p-1.5 text-red-700 dark:bg-red-950/60 dark:text-red-400"
        title="Peor posición que hace 7 días"
        aria-label="Peor posición que hace 7 días"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
          <path d="M12 5v14M12 19l-7-7M12 19l7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md bg-muted p-1.5 text-muted-foreground"
      title="Misma posición que hace 7 días"
      aria-label="Sin cambio respecto a hace 7 días"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
        <path d="M5 12h14" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function RankingCard({
  label,
  posicion,
  total,
  valor,
  descripcion,
  tendencia7d,
  icon: Icon,
  accent = 'slate',
}: {
  label: string;
  posicion: number;
  total: number;
  valor: string | number;
  descripcion: string;
  tendencia7d?: 'up' | 'down' | 'same';
  icon?: React.ComponentType<{ className?: string }>;
  accent?: 'amber' | 'emerald' | 'blue' | 'rose' | 'slate';
}) {
  const t7 = tendencia7d ?? 'same';
  const accentStyles: Record<string, { ring: string; iconBg: string; badge: string }> = {
    slate: {
      ring: 'ring-zinc-200/70 dark:ring-zinc-800',
      iconBg: 'bg-gradient-to-br from-zinc-400 to-zinc-500',
      badge: 'bg-zinc-100 text-zinc-700',
    },
    amber: {
      ring: 'ring-amber-200/70',
      iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
      badge: 'bg-amber-100 text-amber-800',
    },
    emerald: {
      ring: 'ring-emerald-200/70',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      badge: 'bg-emerald-100 text-emerald-800',
    },
    blue: {
      ring: 'ring-blue-200/70',
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      badge: 'bg-blue-100 text-blue-800',
    },
    rose: {
      ring: 'ring-rose-200/70',
      iconBg: 'bg-gradient-to-br from-rose-500 to-rose-600',
      badge: 'bg-rose-100 text-rose-800',
    },
  };
  const style = accentStyles[accent];
  const podio = posicion <= 3;
  return (
    <div
      className={`rounded-2xl border border-transparent bg-card p-4 shadow-md ring-1 ${style.ring} transition-all hover:-translate-y-0.5 hover:shadow-lg`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <p
              className={`text-3xl font-black tabular-nums ${
                podio ? 'text-amber-600' : 'text-foreground'
              }`}
            >
              {posicion}
              <span className="ml-1 text-sm font-medium text-muted-foreground">ª / {total}</span>
            </p>
            {podio && <Trophy className="h-4 w-4 text-amber-500" />}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {Icon && (
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl shadow-md ${style.iconBg}`}
            >
              <Icon className="h-4 w-4 text-white" />
            </div>
          )}
          <RankingTendenciaIcon tendencia={t7} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.badge}`}
        >
          {valor}
        </span>
        <span className="text-[11px] text-muted-foreground">{descripcion}</span>
      </div>
    </div>
  );
}

export default function PuebloMetricasDashboard({
  slug,
  puebloId,
}: {
  slug: string;
  puebloId: number | null;
}) {
  const [data, setData] = useState<MetricasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (!puebloId) {
      setError('No se pudo obtener el ID del pueblo.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/pueblos/${puebloId}/metricas?days=${days}`,
          { cache: 'no-store' }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Error ${res.status}`);
        }
        setData(await res.json());
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error cargando métricas');
      } finally {
        setLoading(false);
      }
    })();
  }, [puebloId, days]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-20 text-muted-foreground">
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            className="opacity-25"
          />
          <path
            d="M4 12a8 8 0 018-8"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="opacity-75"
          />
        </svg>
        Cargando métricas…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <p className="text-red-700 dark:text-red-300">
          {error ?? 'Error desconocido'}
        </p>
      </div>
    );
  }

  const { visitas, valoraciones, web, ranking } = data;

  const chartVisitas = visitas.porDia.map((d) => ({
    dia: formatDay(d.dia),
    Visitas: d.total,
  }));
  const chartValoraciones = valoraciones.porDia.map((d) => ({
    dia: formatDay(d.dia),
    Valoraciones: d.total,
  }));
  const chartWeb = web.porDia.map((d) => ({
    dia: formatDay(d.dia),
    Pageviews: d.total,
  }));
  const hasAppData = web.pageviewsApp > 0 || web.topPaginas.some((p) => p.app > 0);

  return (
    <div className="space-y-8">
      {/* Tile 10 Premios */}
      <a
        href={`/gestion/pueblos/${slug}/metricas/premios`}
        className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-amber-100/70 to-white p-5 shadow-md shadow-amber-100/40 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-amber-900/50 dark:from-amber-950/40 dark:to-card"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.2),transparent_60%)]" aria-hidden />
        <span
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-200"
          aria-hidden
        >
          <Trophy className="h-7 w-7 text-white" strokeWidth={2} />
        </span>
        <div className="relative flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
              Ranking anual
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200">
              <Sparkles className="h-3 w-3" /> 10 premios
            </span>
          </div>
          <div className="mt-0.5 text-base font-bold text-foreground">Los 10 Premios</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Tu posición en cada premio, con los pueblos que tienes por encima y
            por debajo, y flechas de tendencia en tiempo real.
          </div>
        </div>
        <span className="relative inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-transform group-hover:translate-x-0.5">
          Ver <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </a>

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Periodo:</span>
        {[
          { value: 1, label: '24h' },
          { value: 3, label: '3d' },
          { value: 7, label: '7d' },
          { value: 14, label: '14d' },
          { value: 30, label: '30d' },
          { value: 60, label: '60d' },
          { value: 90, label: '3m' },
          { value: 180, label: '6m' },
          { value: 365, label: '1a' },
          { value: 365, label: 'Máx' },
        ].map(({ value, label }) => (
          <button
            key={label === 'Máx' ? 'max' : value}
            onClick={() => setDays(value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              days === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div>
        <h2 className="mb-1 text-lg font-semibold text-foreground">
          Ranking entre pueblos
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          A la derecha del puesto: tendencia respecto a hace 7 días (subir = mejor puesto, número más bajo).
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RankingCard
            label="Valoraciones (histórico)"
            posicion={ranking.valoracionesTotal.posicion}
            total={ranking.totalPueblos}
            valor={ranking.valoracionesTotal.valor.toLocaleString('es-ES')}
            descripcion="Nº total de reseñas."
            tendencia7d={ranking.valoracionesTotal.tendencia7d}
            icon={Star}
            accent="amber"
          />
          <RankingCard
            label={`Valoraciones (${days}d)`}
            posicion={ranking.valoracionesPeriodo.posicion}
            total={ranking.totalPueblos}
            valor={ranking.valoracionesPeriodo.valor.toLocaleString('es-ES')}
            descripcion={`Reseñas nuevas en ${days}d.`}
            tendencia7d={ranking.valoracionesPeriodo.tendencia7d}
            icon={Star}
            accent="amber"
          />
          <RankingCard
            label="Nota media"
            posicion={ranking.valoracionesMedia.posicion}
            total={ranking.totalPueblos}
            valor={ranking.valoracionesMedia.valor.toFixed(1) + ' ★'}
            descripcion="Media ponderada."
            tendencia7d={ranking.valoracionesMedia.tendencia7d}
            icon={Star}
            accent="amber"
          />
          <RankingCard
            label="Visitas totales (GPS + Manual)"
            posicion={ranking.visitasGpsMasManual.posicion}
            total={ranking.totalPueblos}
            valor={ranking.visitasGpsMasManual.valor.toLocaleString('es-ES')}
            descripcion="Todas las visitas en la app."
            tendencia7d={ranking.visitasGpsMasManual.tendencia7d}
            icon={Eye}
            accent="emerald"
          />
          <RankingCard
            label={`Visitas (${days}d)`}
            posicion={ranking.visitasPeriodo.posicion}
            total={ranking.totalPueblos}
            valor={ranking.visitasPeriodo.valor.toLocaleString('es-ES')}
            descripcion={`Visitas en los últimos ${days} días.`}
            tendencia7d={ranking.visitasPeriodo.tendencia7d}
            icon={Eye}
            accent="emerald"
          />
          <RankingCard
            label="Visitas GPS (histórico)"
            posicion={ranking.visitasGps.posicion}
            total={ranking.totalPueblos}
            valor={ranking.visitasGps.valor.toLocaleString('es-ES')}
            descripcion="Geolocalizadas."
            tendencia7d={ranking.visitasGps.tendencia7d}
            icon={MapPinned}
            accent="emerald"
          />
          <RankingCard
            label="Visitas manuales (histórico)"
            posicion={ranking.visitasManual.posicion}
            total={ranking.totalPueblos}
            valor={ranking.visitasManual.valor.toLocaleString('es-ES')}
            descripcion="Marcadas por el usuario."
            tendencia7d={ranking.visitasManual.tendencia7d}
            icon={Smartphone}
            accent="emerald"
          />
          <RankingCard
            label="Visitantes únicos"
            posicion={ranking.visitantesUnicos.posicion}
            total={ranking.totalPueblos}
            valor={ranking.visitantesUnicos.valor.toLocaleString('es-ES')}
            descripcion="Usuarios distintos."
            tendencia7d={ranking.visitantesUnicos.tendencia7d}
            icon={Users}
            accent="emerald"
          />
          <RankingCard
            label={`Visitas GPS (${days}d)`}
            posicion={ranking.visitasPeriodoGps.posicion}
            total={ranking.totalPueblos}
            valor={ranking.visitasPeriodoGps.valor.toLocaleString('es-ES')}
            descripcion="GPS en el periodo."
            tendencia7d={ranking.visitasPeriodoGps.tendencia7d}
            icon={MapPinned}
            accent="emerald"
          />
          <RankingCard
            label={`Visitas manuales (${days}d)`}
            posicion={ranking.visitasPeriodoManual.posicion}
            total={ranking.totalPueblos}
            valor={ranking.visitasPeriodoManual.valor.toLocaleString('es-ES')}
            descripcion="Manuales en el periodo."
            tendencia7d={ranking.visitasPeriodoManual.tendencia7d}
            icon={Smartphone}
            accent="emerald"
          />
          <RankingCard
            label={`Tráfico web/app (${days}d)`}
            posicion={ranking.webPageviews.posicion}
            total={ranking.totalPueblos}
            valor={ranking.webPageviews.valor.toLocaleString('es-ES')}
            descripcion="Páginas vistas en web/app."
            tendencia7d={ranking.webPageviews.tendencia7d}
            icon={Globe}
            accent="blue"
          />
          <RankingCard
            label="Visitas globales"
            posicion={ranking.visitasTotal.posicion}
            total={ranking.totalPueblos}
            valor={ranking.visitasTotal.valor.toLocaleString('es-ES')}
            descripcion="Total histórico."
            tendencia7d={ranking.visitasTotal.tendencia7d}
            icon={Eye}
            accent="emerald"
          />
        </div>
      </div>

      {/* Visitas */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Visitas (app Planifica Fin de semana)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total visitas registradas"
            value={visitas.total}
            sub="Histórico acumulado en app"
            accent="visitas"
            icon={Eye}
          />
          <KpiCard
            label={`Visitas en ${days} días`}
            value={visitas.periodo}
            sub="Solo en el periodo seleccionado"
            accent="visitas"
            icon={Eye}
          />
          <KpiCard
            label="Visitantes únicos"
            value={visitas.visitantesUnicos}
            sub="Usuarios distintos"
            accent="visitas"
            icon={Users}
          />
          <KpiCard
            label="Visitas GPS / Manual"
            value={`${visitas.gps} / ${visitas.manual}`}
            sub="GPS geolocalizadas / marcadas por el usuario"
            accent="visitas"
            icon={MapPinned}
          />
        </div>
        {chartVisitas.length > 0 && (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartVisitas}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dia" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="Visitas"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Valoraciones */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Valoraciones
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total de valoraciones"
            value={valoraciones.total}
            sub="Reseñas acumuladas"
            accent="valoraciones"
            icon={Star}
          />
          <KpiCard
            label={`Valoraciones en ${days} días`}
            value={valoraciones.periodo}
            sub="Reseñas nuevas en el periodo"
            accent="valoraciones"
            icon={Star}
          />
          <KpiCard
            label="Nota media"
            value={valoraciones.media.toFixed(1) + ' ★'}
            sub="Promedio de estrellas (1 a 5)"
            accent="valoraciones"
            icon={Sparkles}
          />
          <div className="rounded-2xl border border-transparent bg-gradient-to-b from-amber-50/70 to-white p-4 shadow-md ring-1 ring-amber-200/70 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:from-amber-950/30 dark:to-card dark:ring-amber-900/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Valoraciones de 5★
                </p>
                <p className="mt-1 text-3xl font-black tabular-nums text-foreground">
                  {(valoraciones.distribucion[5] ?? 0).toLocaleString('es-ES')}
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md">
                <Star className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1.5 text-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <div
                  key={star}
                  className="rounded-md bg-white/80 px-1 py-1 ring-1 ring-amber-200/60 dark:bg-zinc-900/40 dark:ring-amber-900/50"
                >
                  <p className="text-[10px] font-bold text-amber-700">{star}★</p>
                  <p className="text-sm font-bold tabular-nums text-foreground">
                    {(valoraciones.distribucion[star] ?? 0).toLocaleString('es-ES')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Podio de valoraciones (igual que admin) */}
        <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Distribución por estrellas</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={[1, 2, 3, 4, 5].map((r) => ({
                rating: `${r} ★`,
                count: valoraciones.distribucion[r] ?? 0,
              }))}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="rating" tick={{ fontSize: 13 }} className="fill-muted-foreground" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  fontSize: 13,
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                  color: 'var(--foreground)',
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Cell key={i} fill={RATING_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {chartValoraciones.length > 0 && (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartValoraciones}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dia" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="Valoraciones"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Web */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Tráfico de páginas del pueblo
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hasAppData && (
            <KpiCard
              label={`Pageviews totales (${days} días)`}
              value={web.pageviews}
              sub="Suma de Web + App"
              accent="web"
              icon={Globe}
            />
          )}
          <KpiCard
            label={`Pageviews web (${days} días)`}
            value={web.pageviewsWeb}
            sub="Tráfico web de URLs del pueblo"
            accent="web"
            icon={Globe}
          />
          {hasAppData && (
            <KpiCard
              label={`Pageviews app (${days} días)`}
              value={web.pageviewsApp}
              sub="Tráfico app detectado en URLs del pueblo"
              accent="web"
              icon={Smartphone}
            />
          )}
          <KpiCard
            label="Histórico total"
            value={web.pageviewsHistorico}
            sub="Acumulado desde que hay medición"
            accent="web"
            icon={Eye}
          />
          <KpiCard
            label="Sesiones únicas"
            value={web.sesionesUnicas}
            sub={`Navegadores/sesiones distintas en ${days} días`}
            accent="web"
            icon={Users}
          />
          <KpiCard
            label="Crecimiento"
            value={
              web.crecimientoPct === null
                ? 'N/A'
                : `${web.crecimientoPct > 0 ? '+' : ''}${web.crecimientoPct}%`
            }
            sub={`vs ${days} días anteriores`}
            accent="web"
            icon={Sparkles}
          />
        </div>
        {chartWeb.length > 0 && (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartWeb}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dia" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="Pageviews"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {web.topPaginas.length > 0 && (
          <div className="mt-4 rounded-xl border border-border bg-card shadow-sm">
            <h3 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
              {hasAppData ? 'Top páginas (Web + App)' : 'Top páginas (solo Web)'}
            </h3>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                      Ruta
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">
                      Total
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">
                      Web
                    </th>
                    {hasAppData && (
                      <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">
                        App
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {web.topPaginas.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-2 text-foreground font-mono text-xs">
                        {r.path}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-foreground">
                        {r.total.toLocaleString('es-ES')}
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-foreground">
                        {r.web.toLocaleString('es-ES')}
                      </td>
                      {hasAppData && (
                        <td className="px-4 py-2 text-right font-medium text-foreground">
                          {r.app.toLocaleString('es-ES')}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
