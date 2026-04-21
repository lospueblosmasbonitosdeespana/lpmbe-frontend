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
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'default' | 'visitas' | 'valoraciones' | 'web';
}) {
  const accentStyles = {
    default: '',
    visitas: 'border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20',
    valoraciones: 'border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
    web: 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
  };
  return (
    <div className={`rounded-xl border border-border bg-card p-5 shadow-sm ${accentStyles[accent]}`}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold text-foreground">
        {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
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
}: {
  label: string;
  posicion: number;
  total: number;
  valor: string | number;
  descripcion: string;
  tendencia7d?: 'up' | 'down' | 'same';
}) {
  const t7 = tendencia7d ?? 'same';
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="text-2xl font-bold text-foreground">
          {posicion}
          <span className="ml-1 text-base font-medium text-muted-foreground">/ {total}</span>
        </p>
        <RankingTendenciaIcon tendencia={t7} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Valor actual: {valor}</p>
      <p className="mt-1 text-xs text-muted-foreground">{descripcion}</p>
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
      {/* Tile 12 Premios */}
      <a
        href={`/gestion/pueblos/${slug}/metricas/premios`}
        className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-amber-100/40 to-background p-4 transition-colors hover:border-amber-300 hover:bg-amber-50/80"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-200 text-2xl" aria-hidden>
          🏆
        </span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-foreground">12 Premios</div>
          <div className="text-xs text-muted-foreground">
            Tu posición en los reconocimientos anuales y en ventanas móviles de
            3, 7, 15 y 30 días.
          </div>
        </div>
        <span className="text-sm font-medium text-amber-800">Ver →</span>
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
            label="Ranking en valoraciones (histórico)"
            posicion={ranking.valoracionesTotal.posicion}
            total={ranking.totalPueblos}
            valor={ranking.valoracionesTotal.valor.toLocaleString('es-ES')}
            descripcion="Número total de reseñas recibidas."
            tendencia7d={ranking.valoracionesTotal.tendencia7d}
          />
          <RankingCard
            label={`Ranking en valoraciones (${days} días)`}
            posicion={ranking.valoracionesPeriodo.posicion}
            total={ranking.totalPueblos}
            valor={ranking.valoracionesPeriodo.valor.toLocaleString('es-ES')}
            descripcion={`Reseñas nuevas en los últimos ${days} días.`}
            tendencia7d={ranking.valoracionesPeriodo.tendencia7d}
          />
          <RankingCard
            label="Ranking en nota media"
            posicion={ranking.valoracionesMedia.posicion}
            total={ranking.totalPueblos}
            valor={ranking.valoracionesMedia.valor.toFixed(1)}
            descripcion="Promedio de estrellas (de 1 a 5)."
            tendencia7d={ranking.valoracionesMedia.tendencia7d}
          />
          <RankingCard
            label="Ranking en visitas totales (GPS + Manual)"
            posicion={ranking.visitasGpsMasManual.posicion}
            total={ranking.totalPueblos}
            valor={ranking.visitasGpsMasManual.valor.toLocaleString('es-ES')}
            descripcion="Suma de todas las visitas registradas en la app."
            tendencia7d={ranking.visitasGpsMasManual.tendencia7d}
          />
          <RankingCard
            label={`Ranking en visitas (${days} días)`}
            posicion={ranking.visitasPeriodo.posicion}
            total={ranking.totalPueblos}
            valor={ranking.visitasPeriodo.valor.toLocaleString('es-ES')}
            descripcion={`Visitas registradas solo en este periodo de ${days} días.`}
            tendencia7d={ranking.visitasPeriodo.tendencia7d}
          />
          <RankingCard
            label="Ranking en visitas GPS (histórico)"
            posicion={ranking.visitasGps.posicion}
            total={ranking.totalPueblos}
            valor={ranking.visitasGps.valor.toLocaleString('es-ES')}
            descripcion="Visitas validadas por geolocalización del usuario."
            tendencia7d={ranking.visitasGps.tendencia7d}
          />
          <RankingCard
            label="Ranking en visitas manuales (histórico)"
            posicion={ranking.visitasManual.posicion}
            total={ranking.totalPueblos}
            valor={ranking.visitasManual.valor.toLocaleString('es-ES')}
            descripcion="Visitas marcadas manualmente por el usuario."
            tendencia7d={ranking.visitasManual.tendencia7d}
          />
          <RankingCard
            label="Ranking en visitantes únicos"
            posicion={ranking.visitantesUnicos.posicion}
            total={ranking.totalPueblos}
            valor={ranking.visitantesUnicos.valor.toLocaleString('es-ES')}
            descripcion="Usuarios distintos que han registrado visita."
            tendencia7d={ranking.visitantesUnicos.tendencia7d}
          />
          <RankingCard
            label={`Ranking en visitas GPS (${days} días)`}
            posicion={ranking.visitasPeriodoGps.posicion}
            total={ranking.totalPueblos}
            valor={ranking.visitasPeriodoGps.valor.toLocaleString('es-ES')}
            descripcion="Visitas con geolocalización en el periodo actual."
            tendencia7d={ranking.visitasPeriodoGps.tendencia7d}
          />
          <RankingCard
            label={`Ranking en visitas manuales (${days} días)`}
            posicion={ranking.visitasPeriodoManual.posicion}
            total={ranking.totalPueblos}
            valor={ranking.visitasPeriodoManual.valor.toLocaleString('es-ES')}
            descripcion="Visitas marcadas manualmente en el periodo actual."
            tendencia7d={ranking.visitasPeriodoManual.tendencia7d}
          />
          <RankingCard
            label={`Ranking en tráfico de páginas (${days} días)`}
            posicion={ranking.webPageviews.posicion}
            total={ranking.totalPueblos}
            valor={ranking.webPageviews.valor.toLocaleString('es-ES')}
            descripcion="Visitas a URLs del pueblo en la web."
            tendencia7d={ranking.webPageviews.tendencia7d}
          />
          <RankingCard
            label="Ranking en visitas globales"
            posicion={ranking.visitasTotal.posicion}
            total={ranking.totalPueblos}
            valor={ranking.visitasTotal.valor.toLocaleString('es-ES')}
            descripcion="Total histórico de visitas en la app."
            tendencia7d={ranking.visitasTotal.tendencia7d}
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
          />
          <KpiCard
            label={`Visitas en ${days} días`}
            value={visitas.periodo}
            sub="Solo en el periodo seleccionado"
            accent="visitas"
          />
          <KpiCard
            label="Visitantes únicos"
            value={visitas.visitantesUnicos}
            sub="Usuarios distintos que han visitado el pueblo"
            accent="visitas"
          />
          <KpiCard
            label="Visitas GPS / Manual"
            value={`${visitas.gps} / ${visitas.manual}`}
            sub="GPS = geolocalizada, Manual = marcada por el usuario"
            accent="visitas"
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
          />
          <KpiCard
            label={`Valoraciones en ${days} días`}
            value={valoraciones.periodo}
            sub="Reseñas nuevas en el periodo"
            accent="valoraciones"
          />
          <KpiCard
            label="Nota media"
            value={valoraciones.media.toFixed(1)}
            sub="Promedio de estrellas (1 a 5)"
            accent="valoraciones"
          />
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
            <p className="text-sm font-medium text-muted-foreground">Valoraciones de 5★</p>
            <p className="mt-1 text-3xl font-bold text-foreground">
              {(valoraciones.distribucion[5] ?? 0).toLocaleString('es-ES')}
            </p>
            <div className="mt-3 grid grid-cols-5 gap-2 text-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className="rounded-md border border-border bg-background px-2 py-1">
                  <p className="text-xs text-muted-foreground">{star}★</p>
                  <p className="text-sm font-semibold text-foreground">
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
            />
          )}
          <KpiCard
            label={`Pageviews web (${days} días)`}
            value={web.pageviewsWeb}
            sub="Tráfico web de URLs del pueblo"
            accent="web"
          />
          {hasAppData && (
            <KpiCard
              label={`Pageviews app (${days} días)`}
              value={web.pageviewsApp}
              sub="Tráfico app detectado en URLs del pueblo"
              accent="web"
            />
          )}
          <KpiCard
            label="Histórico total"
            value={web.pageviewsHistorico}
            sub="Acumulado desde que hay medición"
            accent="web"
          />
          <KpiCard
            label="Sesiones únicas"
            value={web.sesionesUnicas}
            sub={`Navegadores/sesiones distintas en ${days} días`}
            accent="web"
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
