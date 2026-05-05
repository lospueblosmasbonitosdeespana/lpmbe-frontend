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
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

type DayPoint = { fecha: string; total: number };
type DayVisita = { fecha: string; total: number; gps: number; manual: number };
type DayActivos = { fecha: string; activos: number };
type PathPoint = { path: string; total: number };
type CountryPoint = { country: string; total: number };
type PuebloVisita = { puebloId: number; nombre: string; provincia: string; total: number; gps: number; manual: number };
type PuebloValoracion = { puebloId: number; nombre: string; provincia: string; media: number; total: number };
type PuebloSuscripcion = { puebloId: number; nombre: string; total: number };
type UsuarioPuntos = { userId: number; nombre: string; email: string; total: number };
type MotivoPoint = { motivo: string; total: number };
type TipoPoint = { tipo: string; total: number };

type AppData = {
  periodo: { dias: number; desde: string };
  usuarios: {
    totalActivos: number;
    activos24h: number;
    activos7d: number;
    activos30d: number;
    nuevosPeriodo: number;
    registrosPorDia?: DayPoint[];
    activosPorDia?: DayActivos[];
  };
  visitas: {
    total: number;
    periodo: number;
    gpsTotal: number;
    manualTotal: number;
    gpsPeriodo: number;
    manualPeriodo: number;
    porDia?: DayVisita[];
    topPueblos: PuebloVisita[];
  };
  valoraciones: {
    total: number;
    periodo: number;
    media: number;
    distribucion?: Record<number, number>;
    porDia?: DayPoint[];
    topPueblos: PuebloValoracion[];
  };
  gamificacion: {
    totalPuntos: number;
    porMotivo: MotivoPoint[];
    topUsuarios: UsuarioPuntos[];
    porDia?: DayPoint[];
  };
  suscripcionesPush: {
    total: number;
    porTipo: TipoPoint[];
    topPueblos: PuebloSuscripcion[];
  };
  club: {
    activas: number;
    nuevasPeriodo: number;
    qrValidacionesPeriodo: number;
  };
  tienda: {
    pedidosPagadosPeriodo: number;
  };
  navegacionApp?: {
    pageviewsTotal: number;
    pageviewsPeriodo: number;
    eventosPeriodo: number;
    sesionesUnicasPeriodo: number;
    sesionesUltimas24h?: number;
    pageviewsConUsuarioPeriodo?: number;
    pageviewsAnonimasPeriodo?: number;
    sesionesEspanaPeriodo?: number;
    sesionesExtranjeroPeriodo?: number;
    porDia?: DayPoint[];
    topRutas?: PathPoint[];
    topPaises?: CountryPoint[];
  };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { value: 7, label: '7d' },
  { value: 14, label: '14d' },
  { value: 30, label: '30d' },
  { value: 60, label: '60d' },
  { value: 90, label: '3m' },
  { value: 180, label: '6m' },
  { value: 365, label: '1a' },
];

const MOTIVO_LABELS: Record<string, string> = {
  VISITA: 'Visita pueblo',
  RUTA: 'Ruta completada',
  MULTIEXPERIENCIA: 'Multiexperiencia',
  EVENTO: 'Evento',
};

const TIPO_LABELS: Record<string, string> = {
  NOTICIA: 'Noticias',
  EVENTO: 'Eventos',
  METEO: 'Meteorología',
  ALERTA: 'Alertas',
  SEMAFORO: 'Semáforo',
};

const PIE_COLORS = ['#994920', '#c97b4a', '#e2a87a', '#f5c99a', '#fde8c8'];
const GPS_COLOR = '#1b451e';
const MANUAL_COLOR = '#994920';
const CHART_TOOLTIP_STYLE = {
  borderRadius: 8,
  fontSize: 13,
  border: '1px solid var(--border)',
  backgroundColor: 'var(--card)',
  color: 'var(--foreground)',
};

function fmt(d: string) {
  const p = d.split('-');
  return `${p[2]}/${p[1]}`;
}

function n(v: number) {
  return v.toLocaleString('es-ES');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  highlight,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
  icon?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${
        highlight
          ? 'border-primary/30 bg-primary/5'
          : 'border-border bg-card'
      }`}
    >
      {icon && <div className="mb-2 text-xl">{icon}</div>}
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold text-foreground">
        {typeof value === 'number' ? n(value) : value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
      {children}
    </h2>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <h3 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
        {title}
      </h3>
      <div className="p-4">{children}</div>
    </div>
  );
}

function MiniTable({
  title,
  rows,
  cols,
}: {
  title: string;
  rows: React.ReactNode[][];
  cols: string[];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <h3 className="border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
        {title}
      </h3>
      <div className="max-h-72 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {cols.map((c) => (
                <th
                  key={c}
                  className="px-4 py-2 text-left text-xs font-medium text-muted-foreground"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border last:border-0 hover:bg-muted/20"
              >
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2 text-foreground">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StarBar({
  stars,
  count,
  max,
}: {
  stars: number;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-right text-sm text-muted-foreground">
        {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-sm font-medium text-foreground">{n(count)}</span>
    </div>
  );
}

function EmptyChart() {
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">
      Sin datos en este período
    </p>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AppDashboard() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/datos/app-metricas?days=${days}`, { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || json?.message || `Error ${res.status}`);
        return json;
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-20 text-muted-foreground">
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
        </svg>
        Cargando métricas de la app…
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

  const { usuarios, visitas, valoraciones, gamificacion, suscripcionesPush, club, tienda } = data;
  const navegacionApp = data.navegacionApp ?? {
    pageviewsTotal: 0,
    pageviewsPeriodo: 0,
    eventosPeriodo: 0,
    sesionesUnicasPeriodo: 0,
    sesionesUltimas24h: 0,
    pageviewsConUsuarioPeriodo: 0,
    pageviewsAnonimasPeriodo: 0,
    sesionesEspanaPeriodo: 0,
    sesionesExtranjeroPeriodo: 0,
    porDia: [] as DayPoint[],
    topRutas: [] as PathPoint[],
    topPaises: [] as CountryPoint[],
  };

  const maxRating = Math.max(...Object.values(valoraciones.distribucion ?? {}), 0);
  const visitasDayChart = (visitas.porDia ?? []).map((d) => ({ dia: fmt(d.fecha), GPS: d.gps, Manual: d.manual }));
  const activosDayChart = (usuarios.activosPorDia ?? []).map((d) => ({ dia: fmt(d.fecha), Activos: d.activos }));
  const registrosDayChart = (usuarios.registrosPorDia ?? []).map((d) => ({ dia: fmt(d.fecha), Registros: d.total }));
  const appNavDayChart = (navegacionApp.porDia ?? []).map((d) => ({ dia: fmt(d.fecha), Vistas: d.total }));
  const puntosDayChart = (gamificacion.porDia ?? []).map((d: DayPoint) => ({ dia: fmt(d.fecha), Puntos: d.total }));
  const valoracionesDayChart = (valoraciones.porDia ?? []).map((d) => ({ dia: fmt(d.fecha), Valoraciones: d.total }));

  return (
    <div className="space-y-10">
      {/* Selector de período */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Período:</span>
        {PERIOD_OPTIONS.map(({ value, label }) => (
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

      {/* ── 1. USUARIOS ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>👤 Usuarios</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard label="Usuarios activos" value={usuarios.totalActivos} sub="cuenta activa" icon="👥" />
          <KpiCard label="Activos hoy" value={usuarios.activos24h} sub="últimas 24h" highlight />
          <KpiCard label="Activos esta semana" value={usuarios.activos7d} sub="últimos 7 días" highlight />
          <KpiCard label="Activos este mes" value={usuarios.activos30d} sub="últimos 30 días" highlight />
          <KpiCard label={`Nuevos registros`} value={usuarios.nuevosPeriodo} sub={`últimos ${days}d`} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard title="Usuarios activos por día (con visitas)">
            {activosDayChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={activosDayChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gActivos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#994920" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#994920" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="Activos" stroke="#994920" fill="url(#gActivos)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title="Nuevos registros por día">
            {registrosDayChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={registrosDayChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="Registros" fill="#994920" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>
        </div>
      </section>

      {/* ── 1B. NAVEGACIÓN WEB DESDE APP ───────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>📱 Navegación web desde app</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <KpiCard
            label="Pageviews app (histórico)"
            value={navegacionApp.pageviewsTotal}
            sub="web abierta desde app"
          />
          <KpiCard
            label={`Pageviews app (período)`}
            value={navegacionApp.pageviewsPeriodo}
            sub={`últimos ${days}d`}
            highlight
          />
          <KpiCard
            label={`Eventos app (período)`}
            value={navegacionApp.eventosPeriodo}
            sub={`últimos ${days}d`}
          />
          <KpiCard
            label="Sesiones únicas app"
            value={navegacionApp.sesionesUnicasPeriodo}
            sub={`últimos ${days}d`}
          />
          <KpiCard
            label="Sesiones app (24h)"
            value={navegacionApp.sesionesUltimas24h ?? 0}
            sub="actividad real última jornada"
            highlight
          />
          <KpiCard
            label="Pageviews app anónimas"
            value={navegacionApp.pageviewsAnonimasPeriodo ?? 0}
            sub={`sin userId · últimos ${days}d`}
          />
          <KpiCard
            label="Pageviews app con usuario"
            value={navegacionApp.pageviewsConUsuarioPeriodo ?? 0}
            sub={`con userId · últimos ${days}d`}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard title="Pageviews app por día">
            {appNavDayChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={appNavDayChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gAppNav" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#994920" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#994920" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="Vistas" stroke="#994920" fill="url(#gAppNav)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <MiniTable
            title={`Top rutas vistas desde app (últimos ${days}d)`}
            cols={['Ruta', 'Pageviews']}
            rows={(navegacionApp.topRutas ?? []).map((r) => [
              <span key="path" className="truncate">{r.path}</span>,
              <span key="total" className="font-medium">{n(r.total)}</span>,
            ])}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard title="Alcance geográfico app (sesiones)">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">España</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {n(navegacionApp.sesionesEspanaPeriodo ?? 0)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Extranjero</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {n(navegacionApp.sesionesExtranjeroPeriodo ?? 0)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Basado en sesiones app con metadatos geo (IP/proxy + locale).
            </p>
          </ChartCard>

          <MiniTable
            title={`Top países app (últimos ${days}d)`}
            cols={['País', 'Sesiones']}
            rows={(navegacionApp.topPaises ?? []).map((p) => [
              p.country,
              <span key="total" className="font-medium">{n(p.total)}</span>,
            ])}
          />
        </div>
      </section>

      {/* ── 2. VISITAS APP ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>📍 Visitas a pueblos (app)</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total visitas (histórico)" value={visitas.total} sub="GPS + Manual" />
          <KpiCard label={`Visitas período`} value={visitas.periodo} sub={`últimos ${days}d`} highlight />
          <KpiCard label="Visitas GPS (período)" value={visitas.gpsPeriodo} sub="geolocalización automática" icon="🛰️" />
          <KpiCard label="Visitas Manual (período)" value={visitas.manualPeriodo} sub="marcadas a mano" icon="✋" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard title="Visitas por día — GPS vs Manual">
            {visitasDayChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={visitasDayChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="GPS" stackId="v" fill={GPS_COLOR} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Manual" stackId="v" fill={MANUAL_COLOR} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <MiniTable
            title={`Top 15 pueblos más visitados (últimos ${days}d)`}
            cols={['Pueblo', 'Provincia', 'Total', 'GPS', 'Manual']}
            rows={visitas.topPueblos.map((p) => [
              p.nombre,
              <span key="prov" className="text-xs text-muted-foreground">{p.provincia}</span>,
              <span key="total" className="font-medium">{n(p.total)}</span>,
              <span key="gps" className="text-xs" style={{ color: GPS_COLOR }}>{n(p.gps)}</span>,
              <span key="manual" className="text-xs" style={{ color: MANUAL_COLOR }}>{n(p.manual)}</span>,
            ])}
          />
        </div>
      </section>

      {/* ── 3. VALORACIONES ───────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>⭐ Valoraciones</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total valoraciones" value={valoraciones.total} />
          <KpiCard label="Valoraciones período" value={valoraciones.periodo} sub={`últimos ${days}d`} highlight />
          <KpiCard label="Media global" value={`${valoraciones.media} ⭐`} sub="sobre 5 estrellas" highlight />
          <KpiCard
            label="Distribución"
            value={`${Math.round(((valoraciones.distribucion?.[5] ?? 0) / Math.max(valoraciones.total, 1)) * 100)}% 5★`}
            sub="porcentaje de 5 estrellas"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Distribución estrellas */}
          <ChartCard title="Distribución de valoraciones">
            <div className="space-y-3 py-2">
              {[5, 4, 3, 2, 1].map((s) => (
                <StarBar
                  key={s}
                  stars={s}
                  count={valoraciones.distribucion?.[s] ?? 0}
                  max={maxRating}
                />
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Valoraciones por día">
            {valoracionesDayChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={valoracionesDayChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="Valoraciones" stroke="#f59e0b" fill="url(#gVal)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>
        </div>

        <MiniTable
          title="Top pueblos mejor valorados (mín. 2 valoraciones)"
          cols={['Pueblo', 'Provincia', 'Media', 'Nº valoraciones']}
          rows={valoraciones.topPueblos.map((p) => [
            p.nombre,
            <span key="prov" className="text-xs text-muted-foreground">{p.provincia}</span>,
            <span key="media" className="font-medium text-yellow-600">{'★'.repeat(Math.round(p.media))} {p.media}</span>,
            n(p.total),
          ])}
        />
      </section>

      {/* ── 4. GAMIFICACIÓN ───────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>🏆 Gamificación y puntos</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Total puntos acumulados" value={gamificacion.totalPuntos} sub="todos los usuarios" icon="🏅" />
          <KpiCard
            label="Por visitas"
            value={gamificacion.porMotivo.find((m) => m.motivo === 'VISITA')?.total ?? 0}
            sub="puntos por visitar pueblos"
          />
          <KpiCard
            label="Por rutas / multiexperiencias"
            value={
              (gamificacion.porMotivo.find((m) => m.motivo === 'RUTA')?.total ?? 0) +
              (gamificacion.porMotivo.find((m) => m.motivo === 'MULTIEXPERIENCIA')?.total ?? 0)
            }
            sub="puntos por completar experiencias"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard title="Puntos por tipo de actividad">
            {gamificacion.porMotivo.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={gamificacion.porMotivo.map((m) => ({
                      name: MOTIVO_LABELS[m.motivo] ?? m.motivo,
                      value: m.total,
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${Math.round((percent ?? 0) * 100)}%`}
                    labelLine={false}
                  >
                    {gamificacion.porMotivo.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(v: number | undefined) => [n(v ?? 0), 'Puntos']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <ChartCard title={`Puntos acumulados por día (últimos ${days}d)`}>
            {puntosDayChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={puntosDayChart} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gPuntos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="dia" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="Puntos" stroke="#8b5cf6" fill="url(#gPuntos)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>
        </div>

        <MiniTable
          title="Top 10 usuarios con más puntos"
          cols={['#', 'Usuario', 'Email', 'Puntos totales']}
          rows={gamificacion.topUsuarios.map((u, i) => [
            <span key="pos" className="font-bold text-muted-foreground">{i + 1}</span>,
            u.nombre,
            <span key="email" className="text-xs text-muted-foreground">{u.email}</span>,
            <span key="pts" className="font-bold text-purple-600">{n(u.total)}</span>,
          ])}
        />
      </section>

      {/* ── 5. NOTIFICACIONES PUSH ────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>🔔 Suscripciones push</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Total suscripciones activas" value={suscripcionesPush.total} sub="par usuario-pueblo-tipo" icon="📲" />
          {suscripcionesPush.porTipo.map((t) => (
            <KpiCard
              key={t.tipo}
              label={TIPO_LABELS[t.tipo] ?? t.tipo}
              value={t.total}
              sub="suscripciones activas"
            />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard title="Suscripciones por tipo">
            {suscripcionesPush.porTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={suscripcionesPush.porTipo.map((t) => ({
                    tipo: TIPO_LABELS[t.tipo] ?? t.tipo,
                    Total: t.total,
                  }))}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 70, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis type="category" dataKey="tipo" tick={{ fontSize: 11 }} className="fill-muted-foreground" width={70} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="Total" fill="#994920" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyChart />}
          </ChartCard>

          <MiniTable
            title="Top 10 pueblos con más suscriptores"
            cols={['Pueblo', 'Suscripciones']}
            rows={suscripcionesPush.topPueblos.map((p) => [
              p.nombre,
              <span key="total" className="font-medium">{n(p.total)}</span>,
            ])}
          />
        </div>
      </section>

      {/* ── 6. CLUB + TIENDA ─────────────────────────────────────── */}
      <section className="space-y-4">
        <SectionTitle>🃏 El Club de los más Bonitos &amp; Tienda</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Suscripciones Club activas" value={club.activas} icon="🎖️" />
          <KpiCard label="Nuevas en período" value={club.nuevasPeriodo} sub={`últimos ${days}d`} highlight />
          <KpiCard label="Validaciones QR" value={club.qrValidacionesPeriodo} sub={`últimos ${days}d`} icon="📷" />
          <KpiCard label="Pedidos pagados" value={tienda.pedidosPagadosPeriodo} sub={`últimos ${days}d`} icon="🛒" />
        </div>
      </section>
    </div>
  );
}
