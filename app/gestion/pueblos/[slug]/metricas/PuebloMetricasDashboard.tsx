'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

type MetricasData = {
  pueblo: { id: number; nombre: string; slug: string };
  periodo: { dias: number; desde: string };
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
    topPaginas: Array<{ path: string; total: number }>;
    porDia: Array<{ dia: string; total: number }>;
  };
};

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
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

  const { visitas, valoraciones, web } = data;

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

  return (
    <div className="space-y-8">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Periodo:</span>
        {[7, 14, 30, 60, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              days === d
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Visitas */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Visitas (app Planifica Fin de semana)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Total visitas"
            value={visitas.total}
            sub="Histórico"
          />
          <KpiCard
            label="En el periodo"
            value={visitas.periodo}
            sub={`Últimos ${days} días`}
          />
          <KpiCard
            label="Visitantes únicos"
            value={visitas.visitantesUnicos}
            sub="Usuarios distintos"
          />
          <KpiCard
            label="GPS / Manual"
            value={`${visitas.gps} / ${visitas.manual}`}
            sub="Origen de la visita"
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
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
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
            label="Total valoraciones"
            value={valoraciones.total}
            sub="Histórico"
          />
          <KpiCard
            label="En el periodo"
            value={valoraciones.periodo}
            sub={`Últimos ${days} días`}
          />
          <KpiCard
            label="Media"
            value={valoraciones.media.toFixed(1)}
            sub="Valoración media"
          />
          <KpiCard
            label="Valoraciones 5★"
            value={valoraciones.distribucion[5] ?? 0}
            sub={`1★: ${valoraciones.distribucion[1] ?? 0} · 2★: ${valoraciones.distribucion[2] ?? 0} · 3★: ${valoraciones.distribucion[3] ?? 0} · 4★: ${valoraciones.distribucion[4] ?? 0}`}
          />
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
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
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
          Visitas web (página del pueblo)
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Pageviews"
            value={web.pageviews}
            sub={`Últimos ${days} días`}
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
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {web.topPaginas.length > 0 && (
          <div className="mt-4 rounded-xl border border-border bg-card shadow-sm">
            <h3 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
              Top páginas
            </h3>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
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
