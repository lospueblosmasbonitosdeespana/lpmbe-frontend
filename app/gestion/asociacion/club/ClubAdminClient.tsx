'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

type ClubConfig = {
  inscripcionesAbiertas: boolean;
  precioAnualCents: number;
  precioMensualCents: number;
  oferta: {
    activa: boolean;
    vigente: boolean;
    descuento: number;
    tipo: string;
    expiraEn: string | null;
    texto: string | null;
  };
};

type ClubStats = {
  activas: number;
  canceladasAlExpirar: number;
  historicoCanceladas: number;
  historicoExpiradas: number;
  porPlan: Record<string, number>;
  ingresosTotalCents: number;
  ultimas10: Array<{
    id: number;
    tipo: string;
    estado: string;
    cancelAtPeriodEnd: boolean;
    startsAt: string;
    expiresAt: string;
    importeCents: number | null;
    user: { id: number; nombre: string | null; email: string };
  }>;
};

type RecursoUso = {
  recursoId: number;
  nombre: string;
  tipo: string;
  pueblo: string;
  puebloId: number | null;
  usos: number;
  adultosAtendidos: number;
};

type Suscriptor = {
  id: number;
  tipo: string;
  estado: string;
  cancelAtPeriodEnd: boolean;
  startsAt: string;
  expiresAt: string;
  importeCents: number | null;
  userId: number;
  user: { id: number; nombre: string | null; email: string };
  totalValidaciones?: number;
};

type SuscriptoresPage = {
  total: number;
  page: number;
  limit: number;
  items: Suscriptor[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function euros(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClubAdminClient() {
  const [config, setConfig] = useState<ClubConfig | null>(null);
  const [stats, setStats] = useState<ClubStats | null>(null);
  const [usoRecursos, setUsoRecursos] = useState<RecursoUso[]>([]);
  const [suscriptores, setSuscriptores] = useState<SuscriptoresPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Config edit state
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMsg, setConfigMsg] = useState<string | null>(null);
  const [precioAnual, setPrecioAnual] = useState('');
  const [precioMensual, setPrecioMensual] = useState('');

  // Tabs
  const [tab, setTab] = useState<'resumen' | 'suscriptores' | 'recursos'>('resumen');

  // Suscriptores filter
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [susPage, setSusPage] = useState(1);

  // Uso recursos days
  const [usosDays, setUsosDays] = useState(30);

  // Oferta
  const [ofertaDescuento, setOfertaDescuento] = useState('');
  const [ofertaTipo, setOfertaTipo] = useState('AMBOS');
  const [ofertaExpiraEn, setOfertaExpiraEn] = useState('');
  const [ofertaTexto, setOfertaTexto] = useState('');
  const [savingOferta, setSavingOferta] = useState(false);
  const [ofertaMsg, setOfertaMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cfgRes, statsRes, usoRes] = await Promise.all([
        fetch('/api/club/admin/config'),
        fetch('/api/club/admin/stats'),
        fetch(`/api/club/admin/uso-recursos?days=${usosDays}`),
      ]);

      if (cfgRes.ok) {
        const cfg: ClubConfig = await cfgRes.json();
        setConfig(cfg);
        setPrecioAnual((cfg.precioAnualCents / 100).toFixed(2));
        setPrecioMensual((cfg.precioMensualCents / 100).toFixed(2));
        // Oferta
        setOfertaDescuento(String(cfg.oferta?.descuento ?? 0));
        setOfertaTipo(cfg.oferta?.tipo ?? 'AMBOS');
        setOfertaExpiraEn(cfg.oferta?.expiraEn ? cfg.oferta.expiraEn.slice(0, 16) : '');
        setOfertaTexto(cfg.oferta?.texto ?? '');
      }
      if (statsRes.ok) setStats(await statsRes.json());
      if (usoRes.ok) setUsoRecursos(await usoRes.json());
    } catch {
      setError('Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, [usosDays]);

  const loadSuscriptores = useCallback(async () => {
    const params = new URLSearchParams({ page: String(susPage), limit: '25' });
    if (estadoFiltro) params.set('estado', estadoFiltro);
    const res = await fetch(`/api/club/admin/suscriptores?${params}`);
    if (res.ok) setSuscriptores(await res.json());
  }, [susPage, estadoFiltro]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => {
    if (tab === 'suscriptores') loadSuscriptores();
  }, [tab, susPage, estadoFiltro, loadSuscriptores]);

  async function toggleInscripciones() {
    if (!config) return;
    setSavingConfig(true);
    setConfigMsg(null);
    const next = !config.inscripcionesAbiertas;
    const res = await fetch('/api/club/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inscripcionesAbiertas: next }),
    });
    if (res.ok) {
      const updated: ClubConfig = await res.json();
      setConfig(updated);
      setConfigMsg(next ? 'Inscripciones abiertas. Los usuarios ya pueden suscribirse.' : 'Inscripciones cerradas. Los usuarios no pueden suscribirse.');
    } else {
      setConfigMsg('Error al actualizar. Inténtalo de nuevo.');
    }
    setSavingConfig(false);
  }

  async function savePrecios() {
    setSavingConfig(true);
    setConfigMsg(null);
    const anualCents = Math.round(parseFloat(precioAnual) * 100);
    const mensualCents = Math.round(parseFloat(precioMensual) * 100);
    if (isNaN(anualCents) || isNaN(mensualCents) || anualCents < 0 || mensualCents < 0) {
      setConfigMsg('Los precios deben ser números positivos.');
      setSavingConfig(false);
      return;
    }
    const res = await fetch('/api/club/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ precioAnualCents: anualCents, precioMensualCents: mensualCents }),
    });
    if (res.ok) {
      const updated: ClubConfig = await res.json();
      setConfig(updated);
      setConfigMsg('Precios actualizados correctamente.');
    } else {
      setConfigMsg('Error al guardar los precios.');
    }
    setSavingConfig(false);
  }

  async function toggleOferta() {
    if (!config) return;
    setSavingOferta(true);
    setOfertaMsg(null);
    const next = !config.oferta.activa;
    const res = await fetch('/api/club/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ofertaActiva: next }),
    });
    if (res.ok) {
      const updated: ClubConfig = await res.json();
      setConfig(updated);
      setOfertaMsg(next ? 'Oferta activada.' : 'Oferta desactivada.');
    } else {
      setOfertaMsg('Error al actualizar.');
    }
    setSavingOferta(false);
  }

  async function saveOferta() {
    setSavingOferta(true);
    setOfertaMsg(null);
    const desc = parseInt(ofertaDescuento, 10);
    if (isNaN(desc) || desc < 0 || desc > 100) {
      setOfertaMsg('El descuento debe ser entre 0 y 100.');
      setSavingOferta(false);
      return;
    }
    const body: Record<string, unknown> = {
      ofertaDescuento: desc,
      ofertaTipo,
      ofertaTexto: ofertaTexto || null,
      ofertaExpiraEn: ofertaExpiraEn ? new Date(ofertaExpiraEn).toISOString() : null,
    };
    const res = await fetch('/api/club/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated: ClubConfig = await res.json();
      setConfig(updated);
      setOfertaMsg('Oferta guardada correctamente.');
    } else {
      setOfertaMsg('Error al guardar la oferta.');
    }
    setSavingOferta(false);
  }

  if (loading) return <div className="py-12 text-center text-sm text-gray-500">Cargando...</div>;
  if (error) return <div className="py-12 text-center text-sm text-red-500">{error}</div>;

  return (
    <div className="space-y-6">

      {/* ── CONFIGURACIÓN ─────────────────────────────────────────────── */}
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-800">Configuración del Club</h2>

        {/* Inscripciones abiertas/cerradas */}
        <div className="mb-5 flex items-center justify-between rounded-lg border p-4">
          <div>
            <div className="font-medium text-gray-800">Inscripciones</div>
            <div className="mt-0.5 text-sm text-gray-500">
              {config?.inscripcionesAbiertas
                ? 'Abiertas — los usuarios pueden suscribirse.'
                : 'Cerradas — los usuarios ven una pantalla "próximamente".'}
            </div>
          </div>
          <button
            onClick={toggleInscripciones}
            disabled={savingConfig}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
              config?.inscripcionesAbiertas ? 'bg-green-500' : 'bg-gray-300'
            }`}
            title={config?.inscripcionesAbiertas ? 'Cerrar inscripciones' : 'Abrir inscripciones'}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                config?.inscripcionesAbiertas ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Precios */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio anual (€)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={precioAnual}
              onChange={(e) => setPrecioAnual(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="29.00"
            />
            <p className="mt-1 text-xs text-gray-400">
              {config ? `Actual: ${euros(config.precioAnualCents)}` : ''}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio mensual (€)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={precioMensual}
              onChange={(e) => setPrecioMensual(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="3.99"
            />
            <p className="mt-1 text-xs text-gray-400">
              {config ? `Actual: ${euros(config.precioMensualCents)}` : ''}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={savePrecios}
            disabled={savingConfig}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {savingConfig ? 'Guardando...' : 'Guardar precios'}
          </button>
          {configMsg && (
            <span className={`text-sm ${configMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {configMsg}
            </span>
          )}
        </div>
      </section>

      {/* ── OFERTA / PROMOCIÓN ──────────────────────────────────────── */}
      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-800">Oferta / Promoción</h2>

        {/* Toggle activa */}
        <div className="mb-5 flex items-center justify-between rounded-lg border p-4">
          <div>
            <div className="font-medium text-gray-800">Oferta</div>
            <div className="mt-0.5 text-sm text-gray-500">
              {config?.oferta?.activa ? (
                config?.oferta?.vigente ? (
                  <span className="text-green-600 font-medium">
                    Activa — {config.oferta.descuento}% descuento
                    {config.oferta.tipo !== 'AMBOS' ? ` (solo ${config.oferta.tipo === 'ANUAL' ? 'anual' : 'mensual'})` : ''}
                    {config.oferta.expiraEn && (
                      <span className="text-gray-500 font-normal">
                        {' '}· Expira {new Date(config.oferta.expiraEn).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-amber-600 font-medium">Activada pero expirada — los usuarios no ven descuento</span>
                )
              ) : (
                'Desactivada — no se aplica descuento.'
              )}
            </div>
          </div>
          <button
            onClick={toggleOferta}
            disabled={savingOferta}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
              config?.oferta?.activa ? 'bg-green-500' : 'bg-gray-300'
            }`}
            title={config?.oferta?.activa ? 'Desactivar oferta' : 'Activar oferta'}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                config?.oferta?.activa ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Configuración de la oferta */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={ofertaDescuento}
              onChange={(e) => setOfertaDescuento(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aplica a</label>
            <select
              value={ofertaTipo}
              onChange={(e) => setOfertaTipo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="AMBOS">Anual y Mensual</option>
              <option value="ANUAL">Solo Anual</option>
              <option value="MENSUAL">Solo Mensual</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expira el</label>
            <input
              type="datetime-local"
              value={ofertaExpiraEn}
              onChange={(e) => setOfertaExpiraEn(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-[11px] text-gray-400">Vacío = sin fecha límite</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto promocional</label>
            <input
              type="text"
              value={ofertaTexto}
              onChange={(e) => setOfertaTexto(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Ej: ¡Oferta de lanzamiento!"
            />
          </div>
        </div>

        {/* Preview del precio con descuento */}
        {config && parseInt(ofertaDescuento) > 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-green-300 bg-green-50 p-3">
            <div className="text-xs font-medium text-green-700 mb-1">Vista previa del precio con descuento:</div>
            <div className="flex flex-wrap gap-4 text-sm">
              {(ofertaTipo === 'AMBOS' || ofertaTipo === 'ANUAL') && (
                <div>
                  <span className="text-gray-500">Anual: </span>
                  <span className="line-through text-gray-400 mr-1">{euros(config.precioAnualCents)}</span>
                  <span className="font-bold text-green-700">
                    {euros(Math.round(config.precioAnualCents * (1 - parseInt(ofertaDescuento) / 100)))}
                  </span>
                </div>
              )}
              {(ofertaTipo === 'AMBOS' || ofertaTipo === 'MENSUAL') && (
                <div>
                  <span className="text-gray-500">Mensual: </span>
                  <span className="line-through text-gray-400 mr-1">{euros(config.precioMensualCents)}</span>
                  <span className="font-bold text-green-700">
                    {euros(Math.round(config.precioMensualCents * (1 - parseInt(ofertaDescuento) / 100)))}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={saveOferta}
            disabled={savingOferta}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {savingOferta ? 'Guardando...' : 'Guardar oferta'}
          </button>
          {ofertaMsg && (
            <span className={`text-sm ${ofertaMsg.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {ofertaMsg}
            </span>
          )}
        </div>
      </section>

      {/* ── STATS CARDS ────────────────────────────────────────────────── */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Suscriptores activos"
            value={String(stats.activas)}
            sub={stats.porPlan['ANUAL'] !== undefined ? `${stats.porPlan['ANUAL'] ?? 0} anuales · ${stats.porPlan['MENSUAL'] ?? 0} mensuales` : ''}
            color="green"
          />
          <StatCard
            label="Cancelarán al expirar"
            value={String(stats.canceladasAlExpirar)}
            sub="No renovarán"
            color="amber"
          />
          <StatCard
            label="Bajas históricas"
            value={String(stats.historicoCanceladas + stats.historicoExpiradas)}
            sub={`${stats.historicoCanceladas} canceladas · ${stats.historicoExpiradas} expiradas`}
            color="gray"
          />
          <StatCard
            label="Ingresos registrados"
            value={euros(stats.ingresosTotalCents)}
            sub="Total acumulado"
            color="blue"
          />
        </div>
      )}

      {/* ── TABS ───────────────────────────────────────────────────────── */}
      <div className="border-b">
        <nav className="-mb-px flex gap-6 text-sm">
          {(['resumen', 'suscriptores', 'recursos'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 pb-2 font-medium capitalize transition-colors ${
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'resumen' ? 'Últimas altas' : t === 'suscriptores' ? 'Todos los suscriptores' : 'Uso de recursos'}
            </button>
          ))}
        </nav>
      </div>

      {/* ── TAB: RESUMEN (últimas 10 altas) ────────────────────────────── */}
      {tab === 'resumen' && stats && (
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="text-sm font-semibold text-gray-700">Últimas 10 altas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Alta</th>
                  <th className="px-4 py-3 text-left">Expira</th>
                  <th className="px-4 py-3 text-right">Importe</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.ultimas10.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Sin suscriptores</td>
                  </tr>
                ) : stats.ultimas10.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/gestion/asociacion/club/usuario/${s.user.id}`} className="group">
                        <div className="font-medium text-gray-800 group-hover:text-primary group-hover:underline">{s.user.nombre || '—'}</div>
                        <div className="text-xs text-gray-400">{s.user.email}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <PlanBadge plan={s.tipo} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(s.startsAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(s.expiresAt)}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {s.importeCents != null ? euros(s.importeCents) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.cancelAtPeriodEnd
                        ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Cancela al expirar</span>
                        : <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Activa</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── TAB: TODOS LOS SUSCRIPTORES ─────────────────────────────────── */}
      {tab === 'suscriptores' && (
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Suscriptores {suscriptores ? `(${suscriptores.total} total)` : ''}
            </h2>
            <select
              value={estadoFiltro}
              onChange={(e) => { setEstadoFiltro(e.target.value); setSusPage(1); }}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVA">Activas</option>
              <option value="CADUCADA">Expiradas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Usuario</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Alta</th>
                  <th className="px-4 py-3 text-left">Expira</th>
                  <th className="px-4 py-3 text-center">Validaciones</th>
                  <th className="px-4 py-3 text-right">Importe</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!suscriptores || suscriptores.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin resultados</td>
                  </tr>
                ) : suscriptores.items.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/gestion/asociacion/club/usuario/${s.user.id}`} className="group">
                        <div className="font-medium text-gray-800 group-hover:text-primary group-hover:underline">{s.user.nombre || '—'}</div>
                        <div className="text-xs text-gray-400">{s.user.email}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3"><PlanBadge plan={s.tipo} /></td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(s.startsAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(s.expiresAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${(s.totalValidaciones ?? 0) > 0 ? 'text-primary' : 'text-gray-300'}`}>
                        {s.totalValidaciones ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {s.importeCents != null ? euros(s.importeCents) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <EstadoBadge estado={s.estado} cancelAtPeriodEnd={s.cancelAtPeriodEnd} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Paginación */}
          {suscriptores && suscriptores.total > suscriptores.limit && (
            <div className="flex items-center justify-between px-5 py-3 border-t text-sm text-gray-600">
              <span>Página {suscriptores.page} · {suscriptores.total} registros</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSusPage((p) => Math.max(1, p - 1))}
                  disabled={suscriptores.page === 1}
                  className="rounded border px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
                >← Anterior</button>
                <button
                  onClick={() => setSusPage((p) => p + 1)}
                  disabled={suscriptores.page * suscriptores.limit >= suscriptores.total}
                  className="rounded border px-3 py-1 disabled:opacity-40 hover:bg-gray-50"
                >Siguiente →</button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── TAB: USO DE RECURSOS ─────────────────────────────────────────── */}
      {tab === 'recursos' && (
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Recursos más utilizados — últimos {usosDays} días
            </h2>
            <select
              value={usosDays}
              onChange={(e) => setUsosDays(Number(e.target.value))}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value={7}>7 días</option>
              <option value={30}>30 días</option>
              <option value={90}>90 días</option>
              <option value={365}>Último año</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Recurso</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Pueblo</th>
                  <th className="px-4 py-3 text-center">Usos (OK)</th>
                  <th className="px-4 py-3 text-center">Adultos atendidos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usoRecursos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      Sin datos para este período
                    </td>
                  </tr>
                ) : usoRecursos.map((r, i) => (
                  <tr key={r.recursoId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <span className="font-medium text-gray-800">{r.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 capitalize text-xs">{r.tipo?.toLowerCase().replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-gray-600">{r.pueblo}</td>
                    <td className="px-4 py-3 text-center font-semibold text-primary">{r.usos}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{r.adultosAtendidos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: 'green' | 'amber' | 'gray' | 'blue';
}) {
  const colors = {
    green: 'bg-green-50 border-green-200',
    amber: 'bg-amber-50 border-amber-200',
    gray: 'bg-gray-50 border-gray-200',
    blue: 'bg-blue-50 border-blue-200',
  };
  const textColors = {
    green: 'text-green-700',
    amber: 'text-amber-700',
    gray: 'text-gray-700',
    blue: 'text-blue-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className={`text-2xl font-bold ${textColors[color]}`}>{value}</div>
      <div className="mt-1 text-sm font-medium text-gray-700">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
      plan === 'ANUAL'
        ? 'bg-purple-100 text-purple-700'
        : 'bg-sky-100 text-sky-700'
    }`}>
      {plan === 'ANUAL' ? 'Anual' : 'Mensual'}
    </span>
  );
}

function EstadoBadge({ estado, cancelAtPeriodEnd }: { estado: string; cancelAtPeriodEnd: boolean }) {
  if (estado === 'ACTIVA' && cancelAtPeriodEnd) {
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Cancela al expirar</span>;
  }
  if (estado === 'ACTIVA') {
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Activa</span>;
  }
  if (estado === 'CADUCADA') {
    return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Expirada</span>;
  }
  return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Cancelada</span>;
}
