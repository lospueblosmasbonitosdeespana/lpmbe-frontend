'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

type PuebloVisita = {
  puebloId: number;
  nombre: string;
  slug: string;
  provincia: string | null;
  total: number;
  gps: number;
  manual: number;
};

type PuebloVal = {
  puebloId: number;
  nombre: string;
  slug: string;
  provincia: string | null;
  media: number;
  total: number;
};

type PueblosData = {
  kpis: {
    totalPueblos: number;
    pueblosConVisitas: number;
    pueblosConValoracion: number;
    totalVisitas: number;
    totalValoraciones: number;
    mediaGlobal: number;
    gps: number;
    manual: number;
  };
  distribucionRatings: Record<number, number>;
  topPorVisitas: PuebloVisita[];
  topPorValoracion: PuebloVal[];
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

const RATING_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

export default function PueblosDashboard() {
  const [data, setData] = useState<PueblosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tabRank, setTabRank] = useState<'visitas' | 'valoraciones'>('visitas');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/datos/pueblos-stats', { cache: 'no-store' });
        if (!res.ok) throw new Error('Error cargando estadísticas de pueblos');
        setData(await res.json());
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredVisitas = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    if (!q) return data.topPorVisitas;
    return data.topPorVisitas.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.provincia?.toLowerCase().includes(q) ?? false),
    );
  }, [data, search]);

  const filteredValoraciones = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    if (!q) return data.topPorValoracion;
    return data.topPorValoracion.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.provincia?.toLowerCase().includes(q) ?? false),
    );
  }, [data, search]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-20 text-muted-foreground">
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
        </svg>
        Cargando datos de pueblos…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
        <p className="text-red-700 dark:text-red-300">{error ?? 'Error desconocido'}</p>
      </div>
    );
  }

  const { kpis, distribucionRatings } = data;
  const pctGps = kpis.totalVisitas > 0 ? Math.round((kpis.gps / kpis.totalVisitas) * 100) : 0;

  const ratingsChartData = [1, 2, 3, 4, 5].map((r) => ({
    rating: `${r} ★`,
    count: distribucionRatings[r] ?? 0,
  }));

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Resumen de pueblos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Pueblos en la red" value={kpis.totalPueblos} />
          <KpiCard
            label="Pueblos visitados"
            value={kpis.pueblosConVisitas}
            sub={`${kpis.totalVisitas.toLocaleString('es-ES')} visitas totales`}
          />
          <KpiCard
            label="GPS vs Manual"
            value={`${pctGps}% GPS`}
            sub={`${kpis.gps.toLocaleString('es-ES')} GPS · ${kpis.manual.toLocaleString('es-ES')} manual`}
          />
          <KpiCard
            label="Media global"
            value={`${kpis.mediaGlobal} ★`}
            sub={`${kpis.pueblosConValoracion} pueblos con valoración`}
          />
        </div>
      </section>

      {/* Distribución de ratings */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Distribución de valoraciones</h2>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ratingsChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
                {ratingsChartData.map((_, i) => (
                  <Cell key={i} fill={RATING_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Ranking */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Ranking de pueblos</h2>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {[
              { key: 'visitas' as const, label: 'Por visitas' },
              { key: 'valoraciones' as const, label: 'Por valoración' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTabRank(t.key)}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  tabRank === t.key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Buscar pueblo o provincia…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          {tabRank === 'visitas' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pueblo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Provincia</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Visitas</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">GPS</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Manual</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">% GPS</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Sin resultados
                    </td>
                  </tr>
                ) : (
                  filteredVisitas.map((p, i) => (
                    <tr key={p.puebloId} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{p.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.provincia ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{p.total}</td>
                      <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">{p.gps}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{p.manual}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {p.total > 0 ? Math.round((p.gps / p.total) * 100) : 0}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pueblo</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Provincia</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Media</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Valoraciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredValoraciones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Sin resultados
                    </td>
                  </tr>
                ) : (
                  filteredValoraciones.map((p, i) => (
                    <tr key={p.puebloId} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{p.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.provincia ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-amber-500">{p.media} ★</td>
                      <td className="px-4 py-3 text-right text-foreground">{p.total}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
