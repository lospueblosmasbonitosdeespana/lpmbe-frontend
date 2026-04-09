'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';

/* ─── Types ────────────────────────────────────────────────────────────── */

type RankEntry = { pos: number; trend: 'up' | 'down' | 'same' };

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
  ranking: {
    totalPueblos: number;
    visitasTotal: RankEntry;
    visitasPeriodo: RankEntry;
    valTotal: RankEntry;
    valMedia: RankEntry;
    valPeriodo: RankEntry;
    webPeriodo: RankEntry;
  };
};

type ApiResponse = {
  periodo: { label: string; desde: string; hasta: string };
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
  | 'visitas.total' | 'visitas.periodo' | 'visitas.gps' | 'visitas.visitantesUnicos' | 'visitas.crecimientoPct'
  | 'valoraciones.total' | 'valoraciones.periodo' | 'valoraciones.media' | 'valoraciones.crecimientoPct'
  | 'web.pageviewsPeriodo' | 'web.pageviewsHistorico' | 'web.crecimientoPct'
  | 'ranking.visitasTotal' | 'ranking.visitasPeriodo' | 'ranking.valTotal' | 'ranking.valMedia' | 'ranking.valPeriodo' | 'ranking.webPeriodo';

type ViewMode = 'ranking' | 'visitas' | 'valoraciones' | 'web' | 'resumen';
type PeriodMode = 'days' | 'month' | 'year';

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function getValue(p: PuebloMetrica, key: SortKey): number | string {
  if (key === 'nombre') return p.nombre;
  if (key.startsWith('ranking.')) {
    const k = key.replace('ranking.', '') as keyof PuebloMetrica['ranking'];
    const entry = p.ranking[k];
    if (typeof entry === 'number') return entry;
    return (entry as RankEntry).pos;
  }
  const parts = key.split('.');
  const section = parts[0] as 'visitas' | 'valoraciones' | 'web';
  const field = parts[1];
  const val = (p[section] as any)[field];
  return val ?? -Infinity;
}

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function getAvailableMonths(): Array<{ value: string; label: string }> {
  const now = new Date();
  const months: Array<{ value: string; label: string }> = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    months.push({
      value: `${y}-${String(m + 1).padStart(2, '0')}`,
      label: `${MONTHS_ES[m]} ${y}`,
    });
  }
  return months;
}

function getAvailableYears(): string[] {
  const now = new Date();
  const years: string[] = [];
  for (let y = now.getFullYear(); y >= 2020; y--) {
    years.push(String(y));
  }
  return years;
}

/* ─── Small UI components ──────────────────────────────────────────────── */

function TrendArrow({ trend }: { trend: 'up' | 'down' | 'same' }) {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center justify-center rounded bg-emerald-100 p-0.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400" title="Subió de puesto vs hace 7 días">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M12 5l-6 6M12 5l6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="inline-flex items-center justify-center rounded bg-red-100 p-0.5 text-red-700 dark:bg-red-950/60 dark:text-red-400" title="Bajó de puesto vs hace 7 días">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M12 19l-6-6M12 19l6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center rounded bg-muted p-0.5 text-muted-foreground" title="Sin cambio">
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14" strokeLinecap="round" /></svg>
    </span>
  );
}

function RankCell({ entry, total }: { entry: RankEntry; total: number }) {
  return (
    <td className="px-3 py-2.5 text-center whitespace-nowrap">
      <span className="font-semibold text-foreground tabular-nums">{entry.pos}</span>
      <span className="text-xs text-muted-foreground">/{total}</span>
      <span className="ml-1"><TrendArrow trend={entry.trend} /></span>
    </td>
  );
}

function CrecBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground">—</span>;
  const positive = value > 0;
  const zero = value === 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${
      positive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
        : zero ? 'bg-muted text-muted-foreground'
          : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
    }`}>
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
  if (!active) return <span className="ml-0.5 text-muted-foreground/40">↕</span>;
  return <span className="ml-0.5">{dir === 'asc' ? '↑' : '↓'}</span>;
}

/* ─── Main component ───────────────────────────────────────────────────── */

export default function PueblosMetricasComparativas() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Period state
  const [periodMode, setPeriodMode] = useState<PeriodMode>('days');
  const [days, setDays] = useState(30);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('visitas.periodo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [view, setView] = useState<ViewMode>('resumen');
  const [filterProvincia, setFilterProvincia] = useState('');

  const availableMonths = useMemo(() => getAvailableMonths(), []);
  const availableYears = useMemo(() => getAvailableYears(), []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    let url = '/api/admin/datos/pueblos-metricas-comparativas';
    if (periodMode === 'month') url += `?month=${selectedMonth}`;
    else if (periodMode === 'year') url += `?year=${selectedYear}`;
    else url += `?days=${days}`;

    (async () => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('Error cargando métricas comparativas');
        setData(await res.json());
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    })();
  }, [periodMode, days, selectedMonth, selectedYear]);

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
      setSortDir(key === 'nombre' ? 'asc' : key.startsWith('ranking.') ? 'asc' : 'desc');
    }
  }, [sortKey]);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.pueblos;
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.provincia?.toLowerCase().includes(q) ?? false) ||
        (p.comunidad?.toLowerCase().includes(q) ?? false),
      );
    }
    if (filterProvincia) {
      list = list.filter((p) => p.provincia === filterProvincia);
    }
    return [...list].sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      const na = typeof va === 'number' ? va : 0;
      const nb = typeof vb === 'number' ? vb : 0;
      return sortDir === 'asc' ? na - nb : nb - na;
    });
  }, [data, search, filterProvincia, sortKey, sortDir]);

  const periodLabel = data?.periodo.label ?? '';

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

  const ThBtn = ({ label, sk, className = '' }: { label: string; sk: SortKey; className?: string }) => (
    <th className={`px-3 py-2.5 text-xs font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground whitespace-nowrap ${className}`}>
      <button onClick={() => toggleSort(sk)} className="inline-flex items-center gap-0">
        {label}<SortIcon active={sortKey === sk} dir={sortDir} />
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
      {/* ── Period selectors ─────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Mode selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Ver por:</span>
          {([
            { key: 'days', label: 'Últimos días' },
            { key: 'month', label: 'Mes concreto' },
            { key: 'year', label: 'Año completo' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriodMode(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                periodMode === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Days buttons */}
        {periodMode === 'days' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Periodo:</span>
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
        )}

        {/* Month selector */}
        {periodMode === 'month' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mes:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Year selector */}
        {periodMode === 'year' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Año:</span>
            {availableYears.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedYear === y
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── KPIs globales ────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Pueblos" value={kpis.totalPueblos} />
        <KpiCard label="Visitas totales" value={kpis.totalVisitas} accent="visitas" />
        <KpiCard label={`Visitas (${periodLabel})`} value={kpis.totalVisitasPeriodo} accent="visitas" />
        <KpiCard label="Valoraciones" value={kpis.totalValoraciones} accent="valoraciones" />
        <KpiCard label={`Val. (${periodLabel})`} value={kpis.totalValoracionesPeriodo} accent="valoraciones" />
        <KpiCard label={`Web (${periodLabel})`} value={kpis.totalWebPeriodo} accent="web" />
        <KpiCard label="Media global" value={`${kpis.mediaGlobal} ★`} accent="valoraciones" />
      </div>

      {/* ── Controles ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {([
            { key: 'resumen', label: 'Resumen' },
            { key: 'ranking', label: 'Rankings' },
            { key: 'visitas', label: 'Visitas' },
            { key: 'valoraciones', label: 'Valoraciones' },
            { key: 'web', label: 'Tráfico web' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setView(t.key)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                view === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
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

      <p className="text-xs text-muted-foreground">
        Mostrando {filtered.length} de {data.pueblos.length} pueblos
        {filterProvincia ? ` · ${filterProvincia}` : ''}
        {' · '}Flechas = cambio ranking vs hace 7 días
      </p>

      {/* ── Tabla principal ──────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground w-8">#</th>
              <ThBtn label="Pueblo" sk="nombre" className="text-left" />

              {view === 'resumen' && (
                <>
                  <ThBtn label={`Vis. ${periodLabel}`} sk="visitas.periodo" className="text-right" />
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Δ</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">Rk Vis</th>
                  <ThBtn label={`Val. ${periodLabel}`} sk="valoraciones.periodo" className="text-right" />
                  <ThBtn label="★" sk="valoraciones.media" className="text-right" />
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Δ</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">Rk Val</th>
                  <ThBtn label={`Web ${periodLabel}`} sk="web.pageviewsPeriodo" className="text-right" />
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Δ</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">Rk Web</th>
                </>
              )}

              {view === 'ranking' && (
                <>
                  <ThBtn label="Rk Vis. Total" sk="ranking.visitasTotal" className="text-center" />
                  <ThBtn label={`Rk Vis. ${periodLabel}`} sk="ranking.visitasPeriodo" className="text-center" />
                  <ThBtn label="Rk Val. Total" sk="ranking.valTotal" className="text-center" />
                  <ThBtn label={`Rk Val. ${periodLabel}`} sk="ranking.valPeriodo" className="text-center" />
                  <ThBtn label="Rk Nota ★" sk="ranking.valMedia" className="text-center" />
                  <ThBtn label={`Rk Web ${periodLabel}`} sk="ranking.webPeriodo" className="text-center" />
                </>
              )}

              {view === 'visitas' && (
                <>
                  <ThBtn label="Totales" sk="visitas.total" className="text-right" />
                  <ThBtn label={periodLabel} sk="visitas.periodo" className="text-right" />
                  <ThBtn label="GPS" sk="visitas.gps" className="text-right" />
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">Manual</th>
                  <ThBtn label="Únicos" sk="visitas.visitantesUnicos" className="text-right" />
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted-foreground">% GPS</th>
                  <ThBtn label="Δ" sk="visitas.crecimientoPct" className="text-right" />
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">Rk</th>
                </>
              )}

              {view === 'valoraciones' && (
                <>
                  <ThBtn label="Total" sk="valoraciones.total" className="text-right" />
                  <ThBtn label={periodLabel} sk="valoraciones.periodo" className="text-right" />
                  <ThBtn label="Media ★" sk="valoraciones.media" className="text-right" />
                  <ThBtn label="Δ" sk="valoraciones.crecimientoPct" className="text-right" />
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">Rk Total</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">Rk ★</th>
                </>
              )}

              {view === 'web' && (
                <>
                  <ThBtn label={periodLabel} sk="web.pageviewsPeriodo" className="text-right" />
                  <ThBtn label="Histórico" sk="web.pageviewsHistorico" className="text-right" />
                  <ThBtn label="Δ" sk="web.crecimientoPct" className="text-right" />
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground">Rk</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={20} className="px-4 py-8 text-center text-muted-foreground">Sin resultados</td>
              </tr>
            ) : (
              filtered.map((p, i) => {
                const rk = p.ranking;
                const tot = rk.totalPueblos;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <a href={`/gestion/pueblos/${p.slug}/metricas`} className="font-medium text-foreground hover:text-primary hover:underline">
                        {p.nombre}
                      </a>
                      {p.provincia && <span className="ml-1.5 text-xs text-muted-foreground">({p.provincia})</span>}
                    </td>

                    {view === 'resumen' && (
                      <>
                        {numCell(p.visitas.periodo, true)}
                        <td className="px-3 py-2.5 text-right"><CrecBadge value={p.visitas.crecimientoPct} /></td>
                        <RankCell entry={rk.visitasPeriodo} total={tot} />
                        {numCell(p.valoraciones.periodo, true)}
                        <td className="px-3 py-2.5 text-right font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                          {p.valoraciones.media > 0 ? `${p.valoraciones.media.toFixed(1)} ★` : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right"><CrecBadge value={p.valoraciones.crecimientoPct} /></td>
                        <RankCell entry={rk.valPeriodo} total={tot} />
                        {numCell(p.web.pageviewsPeriodo, true)}
                        <td className="px-3 py-2.5 text-right"><CrecBadge value={p.web.crecimientoPct} /></td>
                        <RankCell entry={rk.webPeriodo} total={tot} />
                      </>
                    )}

                    {view === 'ranking' && (
                      <>
                        <RankCell entry={rk.visitasTotal} total={tot} />
                        <RankCell entry={rk.visitasPeriodo} total={tot} />
                        <RankCell entry={rk.valTotal} total={tot} />
                        <RankCell entry={rk.valPeriodo} total={tot} />
                        <RankCell entry={rk.valMedia} total={tot} />
                        <RankCell entry={rk.webPeriodo} total={tot} />
                      </>
                    )}

                    {view === 'visitas' && (
                      <>
                        {numCell(p.visitas.total, true)}
                        {numCell(p.visitas.periodo, true)}
                        <td className="px-3 py-2.5 text-right tabular-nums text-blue-600 dark:text-blue-400">{p.visitas.gps.toLocaleString('es-ES')}</td>
                        {numCell(p.visitas.manual)}
                        {numCell(p.visitas.visitantesUnicos, true)}
                        <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                          {p.visitas.total > 0 ? Math.round((p.visitas.gps / p.visitas.total) * 100) : 0}%
                        </td>
                        <td className="px-3 py-2.5 text-right"><CrecBadge value={p.visitas.crecimientoPct} /></td>
                        <RankCell entry={rk.visitasPeriodo} total={tot} />
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
                        <RankCell entry={rk.valTotal} total={tot} />
                        <RankCell entry={rk.valMedia} total={tot} />
                      </>
                    )}

                    {view === 'web' && (
                      <>
                        {numCell(p.web.pageviewsPeriodo, true)}
                        {numCell(p.web.pageviewsHistorico)}
                        <td className="px-3 py-2.5 text-right"><CrecBadge value={p.web.crecimientoPct} /></td>
                        <RankCell entry={rk.webPeriodo} total={tot} />
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Top cards ────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TopCard
          title={`Top 5 — Visitas (${periodLabel})`}
          accent="emerald"
          items={[...data.pueblos]
            .sort((a, b) => b.visitas.periodo - a.visitas.periodo)
            .slice(0, 5)
            .map((p, i) => ({
              pos: i + 1, nombre: p.nombre,
              value: p.visitas.periodo.toLocaleString('es-ES'),
              crec: p.visitas.crecimientoPct,
              rank: p.ranking.visitasPeriodo,
            }))}
        />
        <TopCard
          title={`Top 5 — Valoraciones (${periodLabel})`}
          accent="amber"
          items={[...data.pueblos]
            .sort((a, b) => b.valoraciones.periodo - a.valoraciones.periodo)
            .slice(0, 5)
            .map((p, i) => ({
              pos: i + 1, nombre: p.nombre,
              value: `${p.valoraciones.periodo} (${p.valoraciones.media.toFixed(1)} ★)`,
              crec: p.valoraciones.crecimientoPct,
              rank: p.ranking.valPeriodo,
            }))}
        />
        <TopCard
          title={`Top 5 — Tráfico web (${periodLabel})`}
          accent="blue"
          items={[...data.pueblos]
            .sort((a, b) => b.web.pageviewsPeriodo - a.web.pageviewsPeriodo)
            .slice(0, 5)
            .map((p, i) => ({
              pos: i + 1, nombre: p.nombre,
              value: p.web.pageviewsPeriodo.toLocaleString('es-ES'),
              crec: p.web.crecimientoPct,
              rank: p.ranking.webPeriodo,
            }))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <TopCard
          title={`Mayor crecimiento visitas vs periodo anterior`}
          accent="emerald"
          items={[...data.pueblos]
            .filter((p) => p.visitas.crecimientoPct !== null && p.visitas.periodo >= 3)
            .sort((a, b) => (b.visitas.crecimientoPct ?? 0) - (a.visitas.crecimientoPct ?? 0))
            .slice(0, 5)
            .map((p, i) => ({
              pos: i + 1, nombre: p.nombre,
              value: `${p.visitas.periodo} visitas`,
              crec: p.visitas.crecimientoPct,
              rank: p.ranking.visitasPeriodo,
            }))}
        />
        <TopCard
          title={`Mayor crecimiento valoraciones`}
          accent="amber"
          items={[...data.pueblos]
            .filter((p) => p.valoraciones.crecimientoPct !== null && p.valoraciones.periodo >= 1)
            .sort((a, b) => (b.valoraciones.crecimientoPct ?? 0) - (a.valoraciones.crecimientoPct ?? 0))
            .slice(0, 5)
            .map((p, i) => ({
              pos: i + 1, nombre: p.nombre,
              value: `${p.valoraciones.periodo} valorac.`,
              crec: p.valoraciones.crecimientoPct,
              rank: p.ranking.valPeriodo,
            }))}
        />
        <TopCard
          title={`Mayor crecimiento web`}
          accent="blue"
          items={[...data.pueblos]
            .filter((p) => p.web.crecimientoPct !== null && p.web.pageviewsPeriodo >= 5)
            .sort((a, b) => (b.web.crecimientoPct ?? 0) - (a.web.crecimientoPct ?? 0))
            .slice(0, 5)
            .map((p, i) => ({
              pos: i + 1, nombre: p.nombre,
              value: `${p.web.pageviewsPeriodo.toLocaleString('es-ES')} pv`,
              crec: p.web.crecimientoPct,
              rank: p.ranking.webPeriodo,
            }))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopCard
          title="Mejor nota media (mín. 5 valoraciones)"
          accent="amber"
          items={[...data.pueblos]
            .filter((p) => p.valoraciones.total >= 5)
            .sort((a, b) => b.valoraciones.media - a.valoraciones.media || b.valoraciones.total - a.valoraciones.total)
            .slice(0, 10)
            .map((p, i) => ({
              pos: i + 1, nombre: p.nombre,
              value: `${p.valoraciones.media.toFixed(1)} ★ (${p.valoraciones.total} val.)`,
              crec: null,
              rank: p.ranking.valMedia,
            }))}
        />
        <TopCard
          title="Más visitantes únicos"
          accent="emerald"
          items={[...data.pueblos]
            .sort((a, b) => b.visitas.visitantesUnicos - a.visitas.visitantesUnicos)
            .slice(0, 10)
            .map((p, i) => ({
              pos: i + 1, nombre: p.nombre,
              value: `${p.visitas.visitantesUnicos.toLocaleString('es-ES')} únicos`,
              crec: null,
              rank: p.ranking.visitasTotal,
            }))}
        />
      </div>
    </div>
  );
}

/* ─── Top card ─────────────────────────────────────────────────────────── */

function TopCard({
  title, accent, items,
}: {
  title: string;
  accent: 'emerald' | 'amber' | 'blue';
  items: Array<{ pos: number; nombre: string; value: string; crec: number | null; rank?: RankEntry }>;
}) {
  const accentBorder: Record<string, string> = {
    emerald: 'border-t-emerald-500', amber: 'border-t-amber-500', blue: 'border-t-blue-500',
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
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs font-medium text-muted-foreground">{item.value}</span>
                {item.crec !== null && <CrecBadge value={item.crec} />}
                {item.rank && <TrendArrow trend={item.rank.trend} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
