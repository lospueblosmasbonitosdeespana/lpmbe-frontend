'use client';

import { useCallback, useEffect, useState } from 'react';

type Category = 'http' | 'slow' | 'unhandled' | 'cron' | 'email';

type ErrorEntry = {
  ts: number;
  category: Category;
  method: string;
  path: string;
  status: number;
  message: string;
  durationMs?: number;
  ip?: string;
  userAgent?: string;
  stack?: string;
};

type Group = {
  category: Category;
  path: string;
  status: number;
  count: number;
  lastTs: number;
  lastMessage: string;
};

type Summary = {
  startedAt: number;
  now: number;
  windowMs: number | null;
  totalEntries: number;
  considered: number;
  total4xx: number;
  total5xx: number;
  counts: Record<Category, number>;
  groups: Group[];
};

type Response = {
  summary: Summary;
  entries: ErrorEntry[];
};

const WINDOWS = [
  { label: 'Todo', value: '' },
  { label: 'Última hora', value: '60' },
  { label: 'Últimas 6 h', value: '360' },
  { label: 'Últimas 24 h', value: '1440' },
];

const CATEGORIES: { value: '' | Category; label: string }[] = [
  { value: '', label: 'Todas' },
  { value: 'http', label: 'HTTP 4xx/5xx' },
  { value: 'slow', label: 'Lentas (>2,5s)' },
  { value: 'unhandled', label: 'Node no capturado' },
  { value: 'cron', label: 'Cron jobs' },
  { value: 'email', label: 'Emails' },
];

function formatTs(ts: number) {
  return new Date(ts).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function statusBadgeClass(e: { category: Category; status: number }) {
  if (e.category === 'slow') {
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
  }
  if (e.category === 'unhandled') {
    return 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400';
  }
  if (e.category === 'cron') {
    return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
  }
  if (e.category === 'email') {
    return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
  }
  if (e.status >= 500) {
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  }
  if (e.status === 401 || e.status === 403) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  }
  if (e.status === 404) {
    return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
  }
  if (e.status >= 400) {
    return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  }
  return 'bg-muted text-muted-foreground';
}

function categoryLabel(c: Category): string {
  switch (c) {
    case 'http':
      return 'HTTP';
    case 'slow':
      return 'Lenta';
    case 'unhandled':
      return 'Node';
    case 'cron':
      return 'Cron';
    case 'email':
      return 'Email';
    default:
      return c;
  }
}

function statusLabel(e: { category: Category; status: number; durationMs?: number }): string {
  if (e.category === 'slow') return `${e.durationMs ?? e.status} ms`;
  if (e.category === 'unhandled' || e.category === 'cron' || e.category === 'email') return 'ERR';
  return String(e.status);
}

export default function HttpErroresDashboard() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windowMinutes, setWindowMinutes] = useState<string>('60');
  const [categoryFilter, setCategoryFilter] = useState<'' | Category>('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [openStack, setOpenStack] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (windowMinutes) params.set('windowMinutes', windowMinutes);
      if (categoryFilter) params.set('category', categoryFilter);
      params.set('limit', '300');
      const res = await fetch(`/api/admin/http-errors?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setLoading(false);
    }
  }, [windowMinutes, categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchData, 15_000);
    return () => clearInterval(id);
  }, [autoRefresh, fetchData]);

  const clearStore = async () => {
    if (!confirm('¿Vaciar el store de errores en memoria? No afecta a nada más.')) return;
    setClearing(true);
    try {
      await fetch('/api/admin/http-errors', { method: 'DELETE' });
      await fetchData();
    } finally {
      setClearing(false);
    }
  };

  const summary = data?.summary;
  const groups = summary?.groups ?? [];
  const entries = data?.entries ?? [];
  const counts = summary?.counts;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-lg font-semibold text-foreground">Errores y eventos anómalos</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Respuestas 4xx/5xx, requests lentas (&gt;2,5 s), excepciones del proceso Node,
          crons fallidos y envíos de email con error. Se guardan en memoria (máx. 1000) y se
          pierden al reiniciar el backend. No se escribe en base de datos.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Ventana:</span>
            <select
              value={windowMinutes}
              onChange={(e) => setWindowMinutes(e.target.value)}
              className="rounded border border-border bg-background px-2 py-1 text-sm"
            >
              {WINDOWS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Categoría:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as '' | Category)}
              className="rounded border border-border bg-background px-2 py-1 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span className="text-muted-foreground">Auto-refresh 15 s</span>
          </label>

          <button
            onClick={fetchData}
            disabled={loading}
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
          >
            {loading ? 'Cargando…' : 'Refrescar'}
          </button>

          <button
            onClick={clearStore}
            disabled={clearing}
            className="rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300 disabled:opacity-50"
          >
            {clearing ? 'Vaciando…' : 'Vaciar store'}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {summary && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="HTTP 4xx" value={summary.total4xx} tone="amber" />
            <Stat label="HTTP 5xx" value={summary.total5xx} tone="red" />
            <Stat label="Lentas" value={counts?.slow ?? 0} tone="purple" />
            <Stat label="Node" value={counts?.unhandled ?? 0} tone="fuchsia" />
            <Stat label="Cron" value={counts?.cron ?? 0} tone="indigo" />
            <Stat label="Email" value={counts?.email ?? 0} tone="teal" />
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-base font-semibold text-foreground">Agrupado por ruta + status</h3>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay eventos en la ventana seleccionada.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Cat</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Ruta</th>
                  <th className="px-3 py-2">Último mensaje</th>
                  <th className="px-3 py-2">Última vez</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={`${g.category}-${g.status}-${g.path}`} className="border-t border-border">
                    <td className="px-3 py-2 font-mono text-muted-foreground">{g.count}</td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                        {categoryLabel(g.category)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(g)}`}>
                        {statusLabel(g)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs break-all">{g.path}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground break-words max-w-md">
                      {g.lastMessage}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                      {formatTs(g.lastTs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-base font-semibold text-foreground">
          Últimos eventos ({entries.length})
        </h3>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin eventos.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr className="text-left uppercase text-muted-foreground">
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Cat</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Método</th>
                  <th className="px-3 py-2">Ruta</th>
                  <th className="px-3 py-2">Mensaje</th>
                  <th className="px-3 py-2">IP</th>
                  <th className="px-3 py-2">Stack</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={`${e.ts}-${i}`} className="border-t border-border align-top">
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {formatTs(e.ts)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                        {categoryLabel(e.category)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-2 py-0.5 font-semibold ${statusBadgeClass(e)}`}>
                        {statusLabel(e)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono">{e.method}</td>
                    <td className="px-3 py-2 font-mono break-all max-w-xs">{e.path}</td>
                    <td className="px-3 py-2 text-muted-foreground break-words max-w-md">
                      {e.message}
                    </td>
                    <td className="px-3 py-2 font-mono text-muted-foreground whitespace-nowrap">
                      {e.ip ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      {e.stack ? (
                        <button
                          onClick={() => setOpenStack(openStack === i ? null : i)}
                          className="rounded border border-border px-2 py-0.5 text-[10px] hover:bg-muted"
                        >
                          {openStack === i ? 'Ocultar' : 'Ver'}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {openStack !== null && entries[openStack]?.stack && (
              <div className="border-t border-border bg-muted/30 p-3">
                <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] text-foreground">
                  {entries[openStack].stack}
                </pre>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: 'red' | 'amber' | 'purple' | 'fuchsia' | 'indigo' | 'teal' | 'neutral';
}) {
  const toneClass =
    tone === 'red'
      ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
        : tone === 'purple'
          ? 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-300'
          : tone === 'fuchsia'
            ? 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-300'
            : tone === 'indigo'
              ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300'
              : tone === 'teal'
                ? 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-300'
                : 'border-border bg-card text-foreground';
  return (
    <div className={`rounded-lg border p-3 ${toneClass}`}>
      <div className="text-xs uppercase opacity-80">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
