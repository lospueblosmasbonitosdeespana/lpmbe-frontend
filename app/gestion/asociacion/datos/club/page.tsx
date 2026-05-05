'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type ClubCliente = {
  id: number;
  userId: number;
  email: string;
  nombre: string | null;
  apellidos: string | null;
  telefono: string | null;
  numeroSocio: number | null;
  provincia: string | null;
  fechaNacimiento: string | null;
  intereses: string[];
  aceptaMarketing: boolean;
  tipo: string;
  estado: string;
  cancelAtPeriodEnd: boolean;
  startsAt: string;
  expiresAt: string;
  importeCents: number | null;
  diasRestantes: number | null;
  totalVisitas: number;
  totalValidaciones: number;
  clubStatus: string | null;
  clubPlan: string | null;
};

type ListResponse = { items: ClubCliente[]; total: number };

type Stats = {
  activas: number;
  canceladasAlExpirar: number;
  porPlan: Record<string, number>;
  ingresosTotalCents: number;
  caducanEn7d: number;
  caducanEn30d: number;
  altasUlt7d: number;
  altasUlt30d: number;
  lanzamiento: { activos: number; cancelanAlExpirar: number; conversionPct: number | null };
  socioConDatos: number;
  optInMarketing: number;
  topProvincias: Array<{ provincia: string; count: number }>;
};

const TIPO_LABELS: Record<string, string> = {
  ANUAL: 'Anual',
  MENSUAL: 'Mensual',
  LANZAMIENTO: 'Lanzamiento',
};

const ESTADO_LABELS: Record<string, string> = {
  ACTIVA: 'Activa',
  CADUCADA: 'Caducada',
  CANCELADA: 'Cancelada',
};

type TabId =
  | 'todos'
  | 'activos'
  | 'caducanPronto'
  | 'cancelanAlExpirar'
  | 'inactivos'
  | 'topUsadores'
  | 'lanzamiento'
  | 'optInMarketing'
  | 'caducados';

const TABS: Array<{ id: TabId; label: string; description: string }> = [
  { id: 'todos', label: 'Todos', description: 'Todas las suscripciones' },
  { id: 'activos', label: 'Activos', description: 'Suscripciones vigentes' },
  { id: 'caducanPronto', label: 'Caducan pronto', description: 'Activos que expiran en ≤30 días' },
  { id: 'cancelanAlExpirar', label: 'Cancelan al expirar', description: 'Activos sin renovación automática' },
  { id: 'inactivos', label: 'Inactivos', description: 'Activos sin validaciones aún' },
  { id: 'topUsadores', label: 'Top usadores', description: 'Activos ordenados por validaciones' },
  { id: 'lanzamiento', label: 'Lanzamiento', description: 'Socios entrados con N meses gratis' },
  { id: 'optInMarketing', label: 'Opt-in marketing', description: 'Activos con consentimiento de marketing' },
  { id: 'caducados', label: 'Caducados / Cancelados', description: 'Histórico de bajas' },
];

function buildFilterParams(tab: TabId): URLSearchParams {
  const p = new URLSearchParams();
  switch (tab) {
    case 'todos':
      break;
    case 'activos':
      p.set('estado', 'ACTIVA');
      break;
    case 'caducanPronto':
      p.set('estado', 'ACTIVA');
      p.set('caducanEnDias', '30');
      p.set('sort', 'caducanPronto');
      break;
    case 'cancelanAlExpirar':
      p.set('estado', 'ACTIVA');
      p.set('cancelanAlExpirar', 'true');
      break;
    case 'inactivos':
      p.set('estado', 'ACTIVA');
      p.set('sinValidaciones', 'true');
      break;
    case 'topUsadores':
      p.set('estado', 'ACTIVA');
      p.set('sort', 'topUsadores');
      break;
    case 'lanzamiento':
      p.set('tipo', 'LANZAMIENTO');
      break;
    case 'optInMarketing':
      p.set('estado', 'ACTIVA');
      p.set('aceptaMarketing', 'true');
      break;
    case 'caducados':
      p.set('estado', 'CADUCADA');
      break;
  }
  return p;
}

const LIMIT_OPTIONS = [50, 100, 200];

export default function DatosClubPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(50);
  const [tab, setTab] = useState<TabId>('activos');
  const [provincia, setProvincia] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQ, tab, limit, provincia]);

  // Carga KPIs (stats)
  useEffect(() => {
    fetch('/api/club/admin/stats', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStats(d))
      .catch(() => null);
  }, []);

  // Carga listado según tab
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const params = buildFilterParams(tab);
        params.set('limit', String(limit));
        params.set('offset', String(page * limit));
        if (debouncedQ) params.set('q', debouncedQ);
        if (provincia) params.set('provincia', provincia);
        const res = await fetch(`/api/admin/datos/club?${params.toString()}`, { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          const err = await res.json().catch(() => ({}));
          setError(err?.message ?? 'Error cargando datos');
        }
      } catch {
        setError('Error cargando datos');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [debouncedQ, tab, page, limit, provincia]);

  async function handleExport() {
    try {
      setExporting(true);
      const params = buildFilterParams(tab);
      if (debouncedQ) params.set('q', debouncedQ);
      if (provincia) params.set('provincia', provincia);
      const res = await fetch(`/api/admin/datos/club/export?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Error al exportar');
      const json = await res.json();
      const blob = new Blob([json.csv ?? ''], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `socios-club-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const from = total > 0 ? page * limit + 1 : 0;
  const to = Math.min((page + 1) * limit, total);

  const tabMeta = useMemo(() => TABS.find((t) => t.id === tab)!, [tab]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion/datos"
          className="mb-4 inline-block text-sm text-muted-foreground hover:text-gray-900"
        >
          ← Volver a Datos
        </Link>
        <h1 className="text-3xl font-bold">El Club de Los Pueblos más Bonitos</h1>
        <p className="mt-2 text-muted-foreground">
          Suscriptores, KPIs, conversión de lanzamiento y exportación segmentada.
        </p>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────── */}
      {stats && (
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Activos"
            value={stats.activas.toString()}
            sub={`+${stats.altasUlt7d} en 7d · +${stats.altasUlt30d} en 30d`}
          />
          <KpiCard
            title="Caducan pronto"
            value={stats.caducanEn7d.toString()}
            sub={`En 7 días · ${stats.caducanEn30d} en 30 días`}
            tone="amber"
          />
          <KpiCard
            title="Cancelan al expirar"
            value={stats.canceladasAlExpirar.toString()}
            sub="No renovarán automáticamente"
            tone="red"
          />
          <KpiCard
            title="Lanzamiento"
            value={String(stats.lanzamiento.activos)}
            sub={
              stats.lanzamiento.activos > 0
                ? `${stats.lanzamiento.cancelanAlExpirar} cancelarán · ${stats.lanzamiento.conversionPct ?? 0}% conversión esperada`
                : 'No hay socios en lanzamiento'
            }
            tone="amber"
          />
          <KpiCard
            title="Ingresos totales"
            value={`${(stats.ingresosTotalCents / 100).toLocaleString('es-ES', {
              style: 'currency',
              currency: 'EUR',
            })}`}
            sub="Importes registrados (sin Stripe real aún)"
          />
          <KpiCard
            title="Por plan"
            value={Object.entries(stats.porPlan)
              .map(([k, v]) => `${TIPO_LABELS[k] ?? k}: ${v}`)
              .join(' · ') || '—'}
            sub=" "
          />
          <KpiCard
            title="Socios con datos extra"
            value={`${stats.socioConDatos}`}
            sub={`${stats.optInMarketing} aceptan marketing`}
          />
          <KpiCard
            title="Top provincias"
            value={
              stats.topProvincias.length === 0
                ? '—'
                : stats.topProvincias
                    .slice(0, 4)
                    .map((p) => `${p.provincia}: ${p.count}`)
                    .join(' · ')
            }
            sub=" "
          />
        </section>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-border bg-white text-gray-700 hover:bg-muted/50'
              }`}
              title={t.description}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <p className="mb-3 text-xs text-muted-foreground">{tabMeta.description}</p>

      {/* ── Filtros ─────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por email, nombre…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 min-w-[240px] rounded-lg border border-border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Filtrar por provincia (ej. Burgos)"
          value={provincia}
          onChange={(e) => setProvincia(e.target.value)}
          className="rounded-lg border border-border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="rounded-lg border border-border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Resultados por página"
        >
          {LIMIT_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} por página
            </option>
          ))}
        </select>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="ml-auto rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {exporting ? 'Exportando…' : 'Exportar CSV'}
        </button>
      </div>

      {error && <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}

      {/* ── Tabla ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="animate-pulse rounded-lg bg-muted p-8">Cargando...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-muted/30">
                <tr>
                  <Th>Socio</Th>
                  <Th>Nº socio</Th>
                  <Th>Tipo</Th>
                  <Th>Estado</Th>
                  <Th align="right">Importe</Th>
                  <Th>Válida hasta</Th>
                  <Th align="center">Días rest.</Th>
                  <Th align="center">Validaciones</Th>
                  <Th>Provincia</Th>
                  <Th align="center">Marketing</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-muted-foreground">
                      No hay socios que coincidan con los filtros
                    </td>
                  </tr>
                ) : (
                  items.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium text-gray-900">
                            {[c.nombre, c.apellidos].filter(Boolean).join(' ') || '—'}
                          </span>
                          <div className="text-sm text-muted-foreground">{c.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                        {c.numeroSocio != null ? String(c.numeroSocio).padStart(5, '0') : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.tipo === 'LANZAMIENTO'
                              ? 'bg-amber-100 text-amber-800'
                              : c.tipo === 'ANUAL'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {TIPO_LABELS[c.tipo] ?? c.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.estado === 'ACTIVA'
                              ? 'bg-green-100 text-green-800'
                              : c.estado === 'CADUCADA'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-muted text-gray-700'
                          }`}
                        >
                          {ESTADO_LABELS[c.estado] ?? c.estado}
                          {c.cancelAtPeriodEnd && c.estado === 'ACTIVA' && ' · cancela'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {c.importeCents != null ? `${(c.importeCents / 100).toFixed(2)} €` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(c.expiresAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {c.diasRestantes != null ? (
                          <span
                            className={
                              c.diasRestantes <= 7
                                ? 'font-medium text-red-600'
                                : c.diasRestantes <= 30
                                  ? 'font-medium text-amber-600'
                                  : 'text-muted-foreground'
                            }
                          >
                            {c.diasRestantes}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{c.totalValidaciones}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {c.provincia ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {c.aceptaMarketing ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            Sí
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/gestion/asociacion/datos/usuarios/${c.userId}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <span>
              Mostrando {from}–{to} de {total} socios
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded border border-border px-3 py-1.5 font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-gray-700">
                Página {page + 1} de {totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || totalPages === 0}
                className="rounded border border-border px-3 py-1.5 font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      <Link
        href="/gestion/asociacion/club/metricas"
        className="mt-6 inline-block text-sm text-blue-600 hover:underline"
      >
        Ver métricas de validaciones del Club →
      </Link>
    </main>
  );
}

function KpiCard({
  title,
  value,
  sub,
  tone,
}: {
  title: string;
  value: string;
  sub: string;
  tone?: 'amber' | 'red';
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm ${
        tone === 'amber'
          ? 'border-amber-200'
          : tone === 'red'
            ? 'border-red-200'
            : 'border-border'
      }`}
    >
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</div>
      <div
        className={`mt-2 text-2xl font-bold ${
          tone === 'amber' ? 'text-amber-700' : tone === 'red' ? 'text-red-700' : 'text-gray-900'
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
}) {
  const cls = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground ${cls}`}>
      {children}
    </th>
  );
}
