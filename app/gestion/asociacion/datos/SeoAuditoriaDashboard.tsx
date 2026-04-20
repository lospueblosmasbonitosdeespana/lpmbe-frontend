'use client';

import { Fragment, useState } from 'react';

type Severity = 'error' | 'warning' | 'info';

type SeoIssue = { severity: Severity; code: string; message: string };

type SeoResult = {
  url: string;
  status: number;
  fetchMs: number;
  finalUrl: string;
  redirected: boolean;
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  h1Count: number;
  h1First: string | null;
  canonical: string | null;
  robotsMeta: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  jsonLdCount: number;
  imgCount: number;
  imgWithoutAlt: number;
  wordCount: number;
  langAttr: string | null;
  contentType: string | null;
  byteLength: number;
  issues: SeoIssue[];
  error?: string;
};

type Report = {
  baseUrl: string;
  startedAt: number;
  finishedAt: number;
  totalMs: number;
  totalUrls: number;
  totalErrors: number;
  totalWarnings: number;
  results: SeoResult[];
};

function statusColor(r: SeoResult): string {
  if (r.status === 0) return 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300';
  if (r.status >= 500) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (r.status === 404) return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
  if (r.status >= 400) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
  if (r.status >= 300) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
}

function severityIcon(s: Severity): { label: string; cls: string } {
  if (s === 'error') return { label: 'ERR', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
  if (s === 'warning') return { label: 'WARN', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
  return { label: 'INFO', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' };
}

function summarizeSeverity(issues: SeoIssue[]): { err: number; warn: number; info: number } {
  return issues.reduce(
    (acc, i) => {
      if (i.severity === 'error') acc.err++;
      else if (i.severity === 'warning') acc.warn++;
      else acc.info++;
      return acc;
    },
    { err: 0, warn: 0, info: 0 },
  );
}

export default function SeoAuditoriaDashboard() {
  const [report, setReport] = useState<Report | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('https://lospueblosmasbonitosdeespana.org');
  const [extraUrls, setExtraUrls] = useState('');
  const [includePueblos, setIncludePueblos] = useState(15);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'withIssues' | 'errorsOnly'>('withIssues');

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const urls = extraUrls
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const body: Record<string, unknown> = { baseUrl };
      if (urls.length > 0) body.urls = urls;
      else body.includePueblos = includePueblos;

      const res = await fetch('/api/admin/seo/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      setReport(await res.json());
    } catch (e: any) {
      setError(e?.message ?? 'Error');
    } finally {
      setRunning(false);
    }
  };

  const visibleResults = (report?.results ?? []).filter((r) => {
    if (filterSeverity === 'all') return true;
    if (filterSeverity === 'errorsOnly') return r.issues.some((i) => i.severity === 'error');
    return r.issues.length > 0;
  });

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-lg font-semibold text-foreground">Auditoría SEO</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Lanza un crawl de las páginas clave del sitio público y analiza título, meta description,
          H1, canonical, Open Graph, datos estructurados, imágenes sin alt, redirects y más. Sin
          impacto sobre la base de datos.
        </p>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm">
            <span className="text-muted-foreground">URL base</span>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="text-muted-foreground">Top pueblos a incluir</span>
            <input
              type="number"
              min={0}
              max={50}
              value={includePueblos}
              onChange={(e) => setIncludePueblos(Number(e.target.value))}
              disabled={extraUrls.trim().length > 0}
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-sm disabled:opacity-50"
            />
          </label>
          <label className="text-sm lg:col-span-1">
            <span className="text-muted-foreground">Filtro</span>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value as typeof filterSeverity)}
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            >
              <option value="withIssues">Solo con issues</option>
              <option value="errorsOnly">Solo con errores</option>
              <option value="all">Mostrar todas</option>
            </select>
          </label>
        </div>

        <label className="mb-4 block text-sm">
          <span className="text-muted-foreground">
            URLs adicionales (opcional, una por línea; si se rellena, se usan SOLO estas)
          </span>
          <textarea
            value={extraUrls}
            onChange={(e) => setExtraUrls(e.target.value)}
            rows={3}
            placeholder="/alguna-pagina\n/pueblos/mi-pueblo"
            className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-xs"
          />
        </label>

        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={run}
            disabled={running}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {running ? 'Auditando…' : 'Lanzar auditoría'}
          </button>
          {report && (
            <span className="text-xs text-muted-foreground">
              {report.totalUrls} URLs · {report.totalErrors} errores · {report.totalWarnings} warnings ·{' '}
              {(report.totalMs / 1000).toFixed(1)} s
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
      </section>

      {report && (
        <section>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr className="text-left uppercase text-muted-foreground">
                  <th className="px-3 py-2">URL</th>
                  <th className="px-3 py-2">HTTP</th>
                  <th className="px-3 py-2">Issues</th>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Desc</th>
                  <th className="px-3 py-2">H1</th>
                  <th className="px-3 py-2">Canon</th>
                  <th className="px-3 py-2">OG img</th>
                  <th className="px-3 py-2">JSON-LD</th>
                  <th className="px-3 py-2">Imgs sin alt</th>
                  <th className="px-3 py-2">Palabras</th>
                  <th className="px-3 py-2">ms</th>
                </tr>
              </thead>
              <tbody>
                {visibleResults.map((r) => {
                  const sev = summarizeSeverity(r.issues);
                  const path = (() => {
                    try {
                      const u = new URL(r.url);
                      return u.pathname + u.search;
                    } catch {
                      return r.url;
                    }
                  })();
                  const isOpen = expanded === r.url;
                  return (
                    <Fragment key={r.url}>
                      <tr
                        className="cursor-pointer border-t border-border hover:bg-muted/40"
                        onClick={() => setExpanded(isOpen ? null : r.url)}
                      >
                        <td className="px-3 py-2 font-mono break-all max-w-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">{isOpen ? '▾' : '▸'}</span>
                            {path}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`rounded px-2 py-0.5 font-semibold ${statusColor(r)}`}>
                            {r.status || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            {sev.err > 0 && (
                              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                {sev.err} err
                              </span>
                            )}
                            {sev.warn > 0 && (
                              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                {sev.warn} warn
                              </span>
                            )}
                            {sev.info > 0 && (
                              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                                {sev.info} info
                              </span>
                            )}
                            {sev.err + sev.warn + sev.info === 0 && (
                              <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                OK
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {r.title ? (
                            <span title={r.title}>
                              {r.titleLength}c · {r.title.slice(0, 30)}{r.title.length > 30 ? '…' : ''}
                            </span>
                          ) : (
                            <span className="text-red-600">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {r.description ? (
                            <span title={r.description}>{r.descriptionLength}c</span>
                          ) : (
                            <span className="text-red-600">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center font-mono">{r.h1Count}</td>
                        <td className="px-3 py-2 text-center">{r.canonical ? '✓' : '—'}</td>
                        <td className="px-3 py-2 text-center">{r.ogImage ? '✓' : '—'}</td>
                        <td className="px-3 py-2 text-center font-mono">{r.jsonLdCount}</td>
                        <td className="px-3 py-2 text-center font-mono">
                          {r.imgWithoutAlt > 0 ? (
                            <span className="text-amber-600">{r.imgWithoutAlt}/{r.imgCount}</span>
                          ) : (
                            `${r.imgWithoutAlt}/${r.imgCount}`
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                          {r.wordCount}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                          {r.fetchMs}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="border-t border-border bg-muted/20">
                          <td colSpan={12} className="px-4 py-4">
                            <div className="grid gap-4 lg:grid-cols-2">
                              <div className="space-y-2">
                                <DetailRow label="URL">
                                  <a href={r.url} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                                    {r.url}
                                  </a>
                                </DetailRow>
                                {r.redirected && (
                                  <DetailRow label="Redirige a">
                                    <span className="font-mono break-all">{r.finalUrl}</span>
                                  </DetailRow>
                                )}
                                <DetailRow label="Title">{r.title ?? <em className="text-red-600">— ausente —</em>}</DetailRow>
                                <DetailRow label="Description">
                                  {r.description ?? <em className="text-red-600">— ausente —</em>}
                                </DetailRow>
                                <DetailRow label="H1">{r.h1First ?? '—'}</DetailRow>
                                <DetailRow label="Canonical">{r.canonical ?? '—'}</DetailRow>
                                <DetailRow label="Robots">{r.robotsMeta ?? '—'}</DetailRow>
                                <DetailRow label="Lang">{r.langAttr ?? '—'}</DetailRow>
                              </div>
                              <div className="space-y-2">
                                <DetailRow label="og:title">{r.ogTitle ?? '—'}</DetailRow>
                                <DetailRow label="og:description">{r.ogDescription ?? '—'}</DetailRow>
                                <DetailRow label="og:image">{r.ogImage ?? '—'}</DetailRow>
                                <DetailRow label="Imágenes">
                                  {r.imgCount} total, {r.imgWithoutAlt} sin alt
                                </DetailRow>
                                <DetailRow label="Peso">
                                  {Math.round(r.byteLength / 1024)} KB · {r.contentType ?? '—'}
                                </DetailRow>
                              </div>
                            </div>
                            {r.issues.length > 0 && (
                              <div className="mt-4">
                                <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                                  Issues ({r.issues.length})
                                </div>
                                <ul className="space-y-1">
                                  {r.issues.map((iss, idx) => {
                                    const ic = severityIcon(iss.severity);
                                    return (
                                      <li key={idx} className="flex items-start gap-2 text-xs">
                                        <span className={`mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${ic.cls}`}>
                                          {ic.label}
                                        </span>
                                        <span className="font-mono text-muted-foreground">{iss.code}</span>
                                        <span>{iss.message}</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {visibleResults.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              No hay URLs que encajen con el filtro.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-xs">
      <span className="w-28 shrink-0 font-semibold uppercase text-muted-foreground">{label}</span>
      <span className="flex-1 text-foreground break-words">{children}</span>
    </div>
  );
}
