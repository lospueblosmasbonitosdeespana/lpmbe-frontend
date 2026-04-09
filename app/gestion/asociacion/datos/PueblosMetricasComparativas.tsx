'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';

type PuebloMetrica = {
  id: number;
  nombre: string;
  slug: string;
  provincia: string | null;
  comunidad: string | null;
  visitas: {
    total: number;
    periodo: number;
    gps: number;
    manual: number;
    periodoGps: number;
    periodoManual: number;
    visitantesUnicos: number;
    crecimientoPct: number | null;
  };
  valoraciones: {
    total: number;
    periodo: number;
    media: number;
    crecimientoPct: number | null;
  };
  web: {
    pageviewsPeriodo: number;
    pageviewsHistorico: number;
    crecimientoPct: number | null;
  };
};

type ApiResponse = {
  periodo: { dias: number; desde: string };
  kpis: {
    totalPueblos: number;
    totalVisitas: number;
    totalVisitasPeriodo: number;
    totalValoraciones: number;
    totalValoracionesPeriodo: number;
    totalWebPeriodo: number;
    mediaGlobal: number;
  };
  pueblos: PuebloMetrica[];
};

type SortKey =
  | 'nombre'
  | 'visitas.total'
  | 'visitas.periodo'
  | 'visitas.gps'
  | 'visitas.visitantesUnicos'
  | 'visitas.crecimientoPct'
  | 'valoraciones.total'
  | 'valoraciones.periodo'
  | 'valoraciones.media'
  | 'valoraciones.crecimientoPct'
  | 'web.pageviewsPeriodo'
  | 'web.pageviewsHistorico'
  | 'web.crecimientoPct';

type ViewMode = 'visitas' | 'valoraciones' | 'web' | 'resumen';

function getValue(p: PuebloMetrica, key: SortKey): number | string {
  switch (key) {
    case 'nombre': return p.nombre;
    case 'visitas.total': return p.visitas.total;
    case 'visitas.periodo': return p.visitas.periodo;
    case 'visitas.gps': return p.visitas.gps;
    case 'visitas.visitantesUnicos': return p.visitas.visitantesUnicos;
    case 'visitas.crecimientoPct': return p.visitas.crecimientoPct ?? -Infinity;
    case 'valoraciones.total': return p.valoraciones.total;
    case 'valoraciones.periodo': return p.valoraciones.periodo;
    case 'valoraciones.media': return p.valoraciones.media;
    case 'valoraciones.crecimientoPct': return p.valoraciones.crecimientoPct ?? -Infinity;
    case 'web.pageviewsPeriodo': return p.web.pageviewsPeriodo;
    case 'web.pageviewsHistorico': return p.web.pageviewsHistorico;
    case 'web.crecimientoPct': return p.web.crecimientoPct ?? -Infinity;
    default: return 0;
  }
}

function CrecBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground">—</span>;
  const positive = value > 0;
  const zero = value === 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${
        positive
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
          : zero
            ? 'bg-muted text-muted-foreground'
            : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
      }`}
    >
      {positive ? '↑' : zero ? '→' : '↓'}
      {positive ? '+' : ''}{value}%
    </span>
  );
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  const accentStyles: Record<string, string> = {
    visitas: 'border-l-4 border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20',
    valoraciones: 'border-l-4 border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20',
    web: 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
  };
  return (
    <div className={`rounded-xl border border-border bg-card p-5 shadow-sm ${accent ? accentStyles[accent] ?? '' : ''}`}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold text-foreground">
        {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <span className="ml-1 text-muted-foreground/40">↕</span>;
  return <span className="ml-1">{dir === 'asc' ? '↑' : '↓'}</span>;
}

export default function PueblosMetricasComparativas() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('visitas.periodo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [view, setView] = useState<ViewMode>('resumen');
  const [filterProvincia, setFilterProvincia] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch(`/api/admin/datos/pueblos-metricas-comparativas?days=${days}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Error cargando métricas comparativas');
        setData(await res.json());
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    })();
  }, [days]);

  const provincias = useMemo(() => {
    if (!data) return [];
    const set = new Set(data.pueblos.map((p) => p.provincia).filter(Boolean) as string[]);
    return [...set].sort();
  }, [data]);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'nombre' ? 'asc' : 'desc');
    }
  }, [sortKey]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.pueblos;
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          (p.provincia?.toLowerCase().includes(q) ?? false) ||
          (p.comunidad?.toLowerCase().includes(q) ?? false),
      );
    }
    if (filterProvincia) {
      list = list.filter((p) => p.provincia === filterProvincia);
    }
    const sorted = [...list].sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      const na = typeof va === 'number' ? va : 0;
      const nb = typeof vb === 'number' ? vb : 0;
      return sortDir === 'asc' ? na - nb : nb - na;
    });
    return sorted;
  }, [data, search, filterProvincia, sortKey, sortDir]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-20 text-muted-foreground">
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
        </svg>
        Cargando métricas comparativas…
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

  const { kpis } = data;

  const ThButton = ({ label, sortKeyName, className = '' }: { label: string; sortKeyName: SortKey; className?: string }) => (
    <th className={`px-3 py-2.5 text-xs font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground whitespace-nowrap ${className}`}>
      <button onClick={() => toggleSort(sortKeyName)} className="inline-flex items-center gap-0.5">
        {label}
        <SortIcon active={sortKey === sortKeyName} dir={sortDir} />
      </button>
    </th>
  );

  const numCell = (val: number, highlight?: boolean) => (
    <td className={`px-3 py-2.5 text-right tabular-nums ${highlight ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
      {val.toLocaleString('es-ES')}
    </td>
  );

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Periodo:</span>
        {[
          { value: 7, label: '7d' },
          { value: 14, label: '14d' },
          { value: 30, label: '30d' },
          { value: 60, label: '60d' },
          { value: 90, label: '3m' },
          { value: 180, label: '6m' },
          { value: 365, label: '1 año' },
        ].map(({ value, label }) => (
          <button
            key={value}
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

      {/* KPIs globales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Pueblos" value={kpis.totalPueblos} />
        <KpiCard label="Visitas totales" value={kpis.totalVisitas} accent="visitas" />
        <KpiCard label={`Visitas ${days}d`} value={kpis.totalVisitasPeriodo} accent="visitas" />
        <KpiCard label="Valoraciones" value={kpis.totalValoraciones} accent="valoraciones" />
        <KpiCard label={`Valoraciones ${days}d`} value={kpis.totalValoracionesPeriodo} accent="valoraciones" />
        <KpiCard label={`Web ${days}d`} value={kpis.totalWebPeriodo} accent="web" />
        <KpiCard label="Media global" value={`${kpis.mediaGlobal} ★`} accent="valoraciones" />
      </div>

      {/* Controles */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(
            [
              { key: 'resumen', label: 'Resumen' },
              { key: 'visitas', label: 'Visitas (app)' },
              { key: 'valoraciones', label: 'Valoraciones' },
              { key: 'web', label: 'Tráfico web' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                view === t.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select
            value={filterProvincia}
            onChange={(e) => setFilterProvincia(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Todas las provincias</option>
            {provincias.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Buscar pueblo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-48"
          />
        </div>
      </div>

      {/* Indicador de resultados */}
      <p className="text-xs text-muted-foreground">
        Mostrando {filtered.length} de {data.pueblos.length} pueblos
        {filterProvincia ? ` · Provincia: ${filterProvincia}` : ''}
      </p>

      {/* Tabla principal */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground w-8">#</th>
              <ThButton label="Pueblo" sortKeyName="nombre" className="text-left" />
              {view === 'resumen' && (
                <>
                  <ThButton label={`Visitas ${days}d`} sortKeyName="visitas.periodo" className="text-right" />
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Δ Vis.</th>
                  <ThButton label={`Valorac. ${days}d`} sortKeyName="valoraciones.periodo" className="text-right" />
                  <ThButton label="Nota ★" sortKeyName="valoraciones.media" className="text-right" />
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Δ Val.</th>
                  <ThButton label={`Web ${days}d`} sortKeyName="web.pageviewsPeriodo" className="text-right" />
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Δ Web</th>
                  <ThButton label="Visitas tot." sortKeyName="visitas.total" className="text-right" />
                  <ThButton label="Val. tot." sortKeyName="valoraciones.total" className="text-right" />
                </>
              )}
              {view === 'visitas' && (
                <>
                  <ThButton label="Totales" sortKeyName="visitas.total" className="text-right" />
                  <ThButton label={`${days}d`} sortKeyName="visitas.periodo" className="text-right" />
                  <ThButton label="GPS" sortKeyName="visitas.gps" className="text-right" />
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Manual</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">GPS {days}d</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Manual {days}d</th>
                  <ThButton label="V. únicos" sortKeyName="visitas.visitantesUnicos" className="text-right" />
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">% GPS</th>
                  <ThButton label="Δ" sortKeyName="visitas.crecimientoPct" className="text-right" />
                </>
              )}
              {view === 'valoraciones' && (
                <>
                  <ThButton label="Total" sortKeyName="valoraciones.total" className="text-right" />
                  <ThButton label={`${days}d`} sortKeyName="valoraciones.periodo" className="text-right" />
                  <ThButton label="Media ★" sortKeyName="valoraciones.media" className="text-right" />
                  <ThButton label="Δ" sortKeyName="valoraciones.crecimientoPct" className="text-right" />
                </>
              )}
              {view === 'web' && (
                <>
                  <ThButton label={`${days}d`} sortKeyName="web.pageviewsPeriodo" className="text-right" />
                  <ThButton label="Histórico" sortKeyName="web.pageviewsHistorico" className="text-right" />
                  <ThButton label="Δ" sortKeyName="web.crecimientoPct" className="text-right" />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={20} className="px-4 py-8 text-center text-muted-foreground">
                  Sin resultados
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <a
                      href={`/gestion/pueblos/${p.slug}/metricas`}
                      className="font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {p.nombre}
                    </a>
                    {p.provincia && (
                      <span className="ml-1.5 text-xs text-muted-foreground">({p.provincia})</span>
                    )}
                  </td>
                  {view === 'resumen' && (
                    <>
                      {numCell(p.visitas.periodo, true)}
                      <td className="px-3 py-2.5 text-right"><CrecBadge value={p.visitas.crecimientoPct} /></td>
                      {numCell(p.valoraciones.periodo, true)}
                      <td className="px-3 py-2.5 text-right font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                        {p.valoraciones.media > 0 ? `${p.valoraciones.media.toFixed(1)} ★` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right"><CrecBadge value={p.valoraciones.crecimientoPct} /></td>
                      {numCell(p.web.pageviewsPeriodo, true)}
                      <td className="px-3 py-2.5 text-right"><CrecBadge value={p.web.crecimientoPct} /></td>
                      {numCell(p.visitas.total)}
                      {numCell(p.valoraciones.total)}
                    </>
                  )}
                  {view === 'visitas' && (
                    <>
                      {numCell(p.visitas.total, true)}
                      {numCell(p.visitas.periodo, true)}
                      <td className="px-3 py-2.5 text-right tabular-nums text-blue-600 dark:text-blue-400">{p.visitas.gps.toLocaleString('es-ES')}</td>
                      {numCell(p.visitas.manual)}
                      <td className="px-3 py-2.5 text-right tabular-nums text-blue-600 dark:text-blue-400">{p.visitas.periodoGps.toLocaleString('es-ES')}</td>
                      {numCell(p.visitas.periodoManual)}
                      {numCell(p.visitas.visitantesUnicos, true)}
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                        {p.visitas.total > 0 ? Math.round((p.visitas.gps / p.visitas.total) * 100) : 0}%
                      </td>
                      <td className="px-3 py-2.5 text-right"><CrecBadge value={p.visitas.crecimientoPct} /></td>
                    </>
                  )}
                  {view === 'valoraciones' && (
                    <>
                      {numCell(p.valoraciones.total, true)}
                      {numCell(p.valoraciones.periodo, true)}
                      <td className="px-3 py-2.5 text-right font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                        {p.valoraciones.media > 0 ? `${p.valoraciones.media.toFixed(1)} ★` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right"><CrecBadge value={p.valoraciones.crecimientoPct} /></td>
                    </>
                  )}
                  {view === 'web' && (
                    <>
                      {numCell(p.web.pageviewsPeriodo, true)}
                      {numCell(p.web.pageviewsHistorico)}
                      <td className="px-3 py-2.5 text-right"><CrecBadge value={p.web.crecimientoPct} /></td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Top 5 summary cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TopCard
          title={`Top 5 — Visitas ${days}d`}
          accent="emerald"
          items={[...data.pueblos]
            .sort((a, b) => b.visitas.periodo - a.visitas.periodo)
            .slice(0, 5)
            .map((p, i) => ({
              pos: i + 1,
              nombre: p.nombre,
              value: p.visitas.periodo.toLocaleString('es-ES'),
              crec: p.visitas.crecimientoPct,
            }))}
        />
        <TopCard
          title={`Top 5 — Valoraciones ${days}d`}
          accent="amber"
          items={[...data.pueblos]
            .sort((a, b) => b.valoraciones.periodo - a.valoraciones.periodo)
            .slice(0, 5)
            .map((p, i) => ({
              pos: i + 1,
              nombre: p.nombre,
              value: `${p.valoraciones.periodo} (${p.valoraciones.media.toFixed(1)} ★)`,
              crec: p.valoraciones.crecimientoPct,
            }))}
        />
        <TopCard
          title={`Top 5 — Tráfico web ${days}d`}
          accent="blue"
          items={[...data.pueblos]
            .sort((a, b) => b.web.pageviewsPeriodo - a.web.pageviewsPeriodo)
            .slice(0, 5)
            .map((p, i) => ({
              pos: i + 1,
              nombre: p.nombre,
              value: p.web.pageviewsPeriodo.toLocaleString('es-ES'),
              crec: p.web.crecimientoPct,
            }))}
        />
      </div>

      {/* Mayor crecimiento */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TopCard
          title={`Mayor crecimiento visitas vs ${days}d anterior`}
          accent="emerald"
          items={[...data.pueblos]
            .filter((p) => p.visitas.crecimientoPct !== null && p.visitas.periodo >= 3)
            .sort((a, b) => (b.visitas.crecimientoPct ?? 0) - (a.visitas.crecimientoPct ?? 0))
            .slice(0, 5)
            .map((p, i) => ({
              pos: i + 1,
              nombre: p.nombre,
              value: `${p.visitas.periodo} visitas`,
              crec: p.visitas.crecimientoPct,
            }))}
        />
        <TopCard
          title={`Mayor crecimiento valoraciones vs ${days}d anterior`}
          accent="amber"
          items={[...data.pueblos]
            .filter((p) => p.valoraciones.crecimientoPct !== null && p.valoraciones.periodo >= 1)
            .sort((a, b) => (b.valoraciones.crecimientoPct ?? 0) - (a.valoraciones.crecimientoPct ?? 0))
            .slice(0, 5)
            .map((p, i) => ({
              pos: i + 1,
              nombre: p.nombre,
              value: `${p.valoraciones.periodo} valorac.`,
              crec: p.valoraciones.crecimientoPct,
            }))}
        />
        <TopCard
          title={`Mayor crecimiento web vs ${days}d anterior`}
          accent="blue"
          items={[...data.pueblos]
            .filter((p) => p.web.crecimientoPct !== null && p.web.pageviewsPeriodo >= 5)
            .sort((a, b) => (b.web.crecimientoPct ?? 0) - (a.web.crecimientoPct ?? 0))
            .slice(0, 5)
            .map((p, i) => ({
              pos: i + 1,
              nombre: p.nombre,
              value: `${p.web.pageviewsPeriodo.toLocaleString('es-ES')} pageviews`,
              crec: p.web.crecimientoPct,
            }))}
        />
      </div>

      {/* Mejor nota media */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopCard
          title="Mejor nota media (min. 5 valoraciones)"
          accent="amber"
          items={[...data.pueblos]
            .filter((p) => p.valoraciones.total >= 5)
            .sort((a, b) => b.valoraciones.media - a.valoraciones.media || b.valoraciones.total - a.valoraciones.total)
            .slice(0, 10)
            .map((p, i) => ({
              pos: i + 1,
              nombre: p.nombre,
              value: `${p.valoraciones.media.toFixed(1)} ★ (${p.valoraciones.total} val.)`,
              crec: null,
            }))}
        />
        <TopCard
          title="Más visitantes únicos"
          accent="emerald"
          items={[...data.pueblos]
            .sort((a, b) => b.visitas.visitantesUnicos - a.visitas.visitantesUnicos)
            .slice(0, 10)
            .map((p, i) => ({
              pos: i + 1,
              nombre: p.nombre,
              value: `${p.visitas.visitantesUnicos.toLocaleString('es-ES')} únicos`,
              crec: null,
            }))}
        />
      </div>
    </div>
  );
}

function TopCard({
  title,
  accent,
  items,
}: {
  title: string;
  accent: 'emerald' | 'amber' | 'blue';
  items: Array<{ pos: number; nombre: string; value: string; crec: number | null }>;
}) {
  const accentBorder: Record<string, string> = {
    emerald: 'border-t-emerald-500',
    amber: 'border-t-amber-500',
    blue: 'border-t-blue-500',
  };
  const medalColors = ['text-amber-500', 'text-zinc-400', 'text-orange-600'];

  return (
    <div className={`rounded-xl border border-border border-t-2 ${accentBorder[accent]} bg-card p-4 shadow-sm`}>
      <h3 className="mb-3 text-sm font-semibold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin datos suficientes</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={`${item.pos}-${item.nombre}`} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-sm font-bold w-5 text-right ${item.pos <= 3 ? medalColors[item.pos - 1] : 'text-muted-foreground'}`}>
                  {item.pos}
                </span>
                <span className="text-sm text-foreground truncate">{item.nombre}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-medium text-muted-foreground">{item.value}</span>
                {item.crec !== null && <CrecBadge value={item.crec} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
