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

type DayPoint = { fecha: string; total: number };
type PathRow = { path: string; total: number };
type SourceRow = { source: string; total: number };
type DeviceRow = { deviceType: string; total: number };
type BrowserRow = { browser: string; total: number };
type ReferrerRow = { referrerHost: string; total: number };
type EventRow = { eventName: string; total: number };

type WebData = {
  periodo: { dias: number; desde: string };
  resumen: {
    totalPageViews: number;
    totalEvents: number;
    uniqueSessions: number;
    promedioPorDia: number;
  };
  porDia: DayPoint[];
  porRuta: PathRow[];
  porOrigen: SourceRow[];
  porDispositivo: DeviceRow[];
  porNavegador: BrowserRow[];
  referrers: ReferrerRow[];
  eventos: EventRow[];
};

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
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

function MiniTable({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <h3 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">{title}</h3>
      <div className="max-h-72 overflow-y-auto">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2 text-foreground">{r.label}</td>
                <td className="px-4 py-2 text-right font-medium text-foreground">{r.value.toLocaleString('es-ES')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function WebDashboard() {
  const [data, setData] = useState<WebData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/admin/datos/visitas-web?days=${days}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Error cargando analítica web');
        setData(await res.json());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-20 text-muted-foreground">
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
        </svg>
        Cargando analítica web…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <p className="text-red-700 dark:text-red-300">{error ?? 'Error desconocido'}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Los datos de analítica web se empezarán a acumular desde que el tracker esté activo.
          GTM/GA4 sigue funcionando en paralelo.
        </p>
      </div>
    );
  }

  const { resumen, porDia, porRuta, porDispositivo, porNavegador, referrers, eventos } = data;
  const pagesPerSession = resumen.uniqueSessions > 0
    ? Math.round((resumen.totalPageViews / resumen.uniqueSessions) * 10) / 10
    : 0;

  const chartData = porDia.map((d) => ({ dia: formatDay(d.fecha), Pageviews: d.total }));

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

      {/* KPIs */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Analítica web</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Pageviews" value={resumen.totalPageViews} sub={`~${resumen.promedioPorDia}/día`} />
          <KpiCard label="Sesiones únicas" value={resumen.uniqueSessions} />
          <KpiCard label="Páginas/sesión" value={pagesPerSession} />
          <KpiCard label="Eventos" value={resumen.totalEvents} />
        </div>
      </section>

      {/* Chart */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Evolución de pageviews</h2>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
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
                <Area type="monotone" dataKey="Pageviews" stroke="#6366f1" fill="url(#gPv)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-muted-foreground">
              Sin datos de pageviews en este periodo. Los datos aparecerán cuando el tracker esté activo.
            </p>
          )}
        </div>
      </section>

      {/* Tables */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Detalles</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MiniTable
            title="Top páginas"
            rows={porRuta.map((r) => ({ label: r.path, value: r.total }))}
          />
          <MiniTable
            title="Referrers"
            rows={referrers.map((r) => ({ label: r.referrerHost, value: r.total }))}
          />
          <MiniTable
            title="Dispositivos"
            rows={porDispositivo.map((r) => ({ label: r.deviceType, value: r.total }))}
          />
          <MiniTable
            title="Navegadores"
            rows={porNavegador.map((r) => ({ label: r.browser, value: r.total }))}
          />
          <MiniTable
            title="Eventos"
            rows={eventos.map((r) => ({ label: r.eventName, value: r.total }))}
          />
        </div>
      </section>
    </div>
  );
}
