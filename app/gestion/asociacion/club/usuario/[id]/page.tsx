'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────

type UsuarioDetalle = {
  usuario: {
    id: number;
    email: string;
    nombre: string | null;
    apellidos: string | null;
    telefono: string | null;
    rol: string | null;
    createdAt: string;
    avatarUrl: string | null;
    clubStatus: string | null;
    clubPlan: string | null;
    clubValidUntil: string | null;
  };
  suscripciones: Array<{
    id: number;
    tipo: string;
    estado: string;
    cancelAtPeriodEnd: boolean;
    startsAt: string;
    expiresAt: string;
    importeCents: number | null;
    createdAt: string;
  }>;
  resumen: {
    totalValidaciones: number;
    validacionesOk: number;
    validacionesNoOk: number;
    totalAdultos: number;
    pueblosVisitados: number;
    recursosUsados: number;
    ingresosTotalCents: number;
    primerUso: string | null;
    ultimoUso: string | null;
  };
  pueblosVisitados: Array<{ id: number; nombre: string }>;
  recursosUsados: Array<{
    id: number;
    nombre: string;
    tipo: string;
    scope: string;
    pueblo: string;
    usos: number;
    ultimoUso: string;
  }>;
  actividadDiaria: Array<{
    fecha: string;
    total: number;
    ok: number;
    adultos: number;
  }>;
  validaciones: Array<{
    id: number;
    resultado: string;
    adultos: number;
    descuento: number | null;
    fecha: string;
    recurso: {
      id: number;
      nombre: string;
      tipo: string;
      scope: string;
    } | null;
    pueblo: string | null;
  }>;
};

// ─── Helpers ────────────────────────────────────────────────────────────

function euros(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function fmtDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

// ─── Component ──────────────────────────────────────────────────────────

export default function UsuarioDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<UsuarioDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'validaciones' | 'recursos' | 'pueblos' | 'suscripciones' | 'actividad'>('validaciones');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/club/admin/usuario/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Error cargando datos');
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="py-16 text-center text-gray-400">Cargando perfil del usuario...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
          {error ?? 'Usuario no encontrado'}
        </div>
        <div className="mt-4 text-sm">
          <Link href="/gestion/asociacion/club" className="text-gray-500 hover:underline">← Volver al Club</Link>
        </div>
      </div>
    );
  }

  const { usuario: u, resumen: r } = data;

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      {/* ── Header con perfil ─────────────────────────────────────── */}
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
          {u.avatarUrl ? (
            <img src={u.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            (u.nombre?.[0] ?? u.email[0]).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-gray-800 truncate">
            {u.nombre ? `${u.nombre} ${u.apellidos ?? ''}`.trim() : u.email}
          </h1>
          <p className="text-sm text-gray-500">{u.email}</p>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">
              {u.rol ?? 'USUARIO'}
            </span>
            {u.telefono && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-500">
                {u.telefono}
              </span>
            )}
            <span className="text-gray-400">
              Registrado {fmtDate(u.createdAt)}
            </span>
          </div>
        </div>

        <Link
          href="/gestion/asociacion/club"
          className="shrink-0 text-sm text-gray-400 hover:text-gray-700 hover:underline"
        >
          ← Volver
        </Link>
      </div>

      {/* ── Tarjetas de resumen ───────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Validaciones OK"
          value={String(r.validacionesOk)}
          sub={r.validacionesNoOk > 0 ? `${r.validacionesNoOk} rechazadas` : 'Ninguna rechazada'}
          color="green"
        />
        <StatCard
          label="Adultos atendidos"
          value={String(r.totalAdultos)}
          sub={r.primerUso ? `Desde ${fmtDate(r.primerUso)}` : 'Sin datos'}
          color="blue"
        />
        <StatCard
          label="Pueblos visitados"
          value={String(r.pueblosVisitados)}
          sub={`${r.recursosUsados} recursos distintos`}
          color="purple"
        />
        <StatCard
          label="Ingresos totales"
          value={euros(r.ingresosTotalCents)}
          sub={`${data.suscripciones.length} suscripción(es)`}
          color="amber"
        />
      </div>

      {/* ── Membresía actual ──────────────────────────────────────── */}
      {data.suscripciones.length > 0 && (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Membresía actual</h2>
          {(() => {
            const activa = data.suscripciones.find((s) => s.estado === 'ACTIVA');
            if (!activa) {
              return <p className="text-sm text-gray-400">Sin suscripción activa. Última suscripción: {data.suscripciones[0].estado} ({fmtDate(data.suscripciones[0].expiresAt)})</p>;
            }
            return (
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-gray-500">Plan</span>
                  <div className="font-semibold">{activa.tipo === 'ANUAL' ? 'Anual' : 'Mensual'}</div>
                </div>
                <div>
                  <span className="text-gray-500">Desde</span>
                  <div className="font-semibold">{fmtDate(activa.startsAt)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Expira</span>
                  <div className="font-semibold">{fmtDate(activa.expiresAt)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Renovación</span>
                  <div className="font-semibold">
                    {activa.cancelAtPeriodEnd
                      ? <span className="text-amber-600">No renovará</span>
                      : <span className="text-green-600">Automática</span>}
                  </div>
                </div>
                {activa.importeCents != null && (
                  <div>
                    <span className="text-gray-500">Pagado</span>
                    <div className="font-semibold">{euros(activa.importeCents)}</div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="border-b">
        <nav className="-mb-px flex gap-4 text-sm overflow-x-auto">
          {([
            ['validaciones', `Historial (${data.validaciones.length})`],
            ['recursos', `Recursos (${data.recursosUsados.length})`],
            ['pueblos', `Pueblos (${data.pueblosVisitados.length})`],
            ['actividad', `Actividad diaria (${data.actividadDiaria.length})`],
            ['suscripciones', `Suscripciones (${data.suscripciones.length})`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`whitespace-nowrap border-b-2 pb-2 font-medium transition-colors ${
                tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── TAB: Historial de validaciones ────────────────────────── */}
      {tab === 'validaciones' && (
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b">
            <h2 className="text-sm font-semibold text-gray-700">
              Todas las validaciones
              <span className="ml-2 text-xs font-normal text-gray-400">
                {r.ultimoUso ? `Última: ${fmtDateTime(r.ultimoUso)}` : ''}
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Recurso</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Pueblo</th>
                  <th className="px-4 py-3 text-center">Adultos</th>
                  <th className="px-4 py-3 text-center">Descuento</th>
                  <th className="px-4 py-3 text-center">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.validaciones.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin validaciones</td></tr>
                ) : data.validaciones.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{fmtDateTime(v.fecha)}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-gray-800">{v.recurso?.nombre ?? '—'}</span>
                      {v.recurso?.scope === 'ASOCIACION' && (
                        <span className="ml-1.5 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">ASOC.</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs capitalize">{v.recurso?.tipo?.toLowerCase().replace(/_/g, ' ') ?? '—'}</td>
                    <td className="px-4 py-2.5 text-gray-600">{v.pueblo ?? '—'}</td>
                    <td className="px-4 py-2.5 text-center">{v.adultos}</td>
                    <td className="px-4 py-2.5 text-center">
                      {v.descuento != null ? `${v.descuento}%` : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <ResultadoBadge resultado={v.resultado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── TAB: Recursos usados ──────────────────────────────────── */}
      {tab === 'recursos' && (
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b">
            <h2 className="text-sm font-semibold text-gray-700">Recursos utilizados (distintos)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Recurso</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Ámbito</th>
                  <th className="px-4 py-3 text-left">Pueblo</th>
                  <th className="px-4 py-3 text-center">Veces usado</th>
                  <th className="px-4 py-3 text-left">Último uso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recursosUsados.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No ha usado recursos</td></tr>
                ) : data.recursosUsados.map((rec, i) => (
                  <tr key={rec.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{rec.nombre}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs capitalize">{rec.tipo?.toLowerCase().replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        rec.scope === 'ASOCIACION'
                          ? 'bg-purple-50 text-purple-600'
                          : 'bg-blue-50 text-blue-600'
                      }`}>
                        {rec.scope === 'ASOCIACION' ? 'Asociación' : 'Pueblo'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{rec.pueblo}</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-primary">{rec.usos}</td>
                    <td className="px-4 py-2.5 text-gray-500">{fmtDate(rec.ultimoUso)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── TAB: Pueblos visitados ────────────────────────────────── */}
      {tab === 'pueblos' && (
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b">
            <h2 className="text-sm font-semibold text-gray-700">Pueblos visitados ({data.pueblosVisitados.length})</h2>
          </div>
          {data.pueblosVisitados.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No ha visitado ningún pueblo</div>
          ) : (
            <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.pueblosVisitados.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-lg border p-3 hover:bg-gray-50">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 text-sm font-bold">✓</span>
                  <span className="text-sm font-medium text-gray-700">{p.nombre}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── TAB: Actividad diaria ─────────────────────────────────── */}
      {tab === 'actividad' && (
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b">
            <h2 className="text-sm font-semibold text-gray-700">Actividad diaria</h2>
          </div>
          {data.actividadDiaria.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">Sin actividad registrada</div>
          ) : (
            <>
              {/* Mini gráfico de barras */}
              <div className="px-5 py-4">
                <div className="flex items-end gap-1 h-24">
                  {data.actividadDiaria.slice(0, 60).reverse().map((d, i) => {
                    const max = Math.max(...data.actividadDiaria.map((x) => x.ok), 1);
                    const h = Math.max(4, (d.ok / max) * 100);
                    return (
                      <div key={i} className="group relative flex-1 min-w-[4px]">
                        <div
                          className="w-full rounded-t bg-primary/70 transition-colors hover:bg-primary"
                          style={{ height: `${h}%` }}
                          title={`${fmtDateShort(d.fecha)}: ${d.ok} OK, ${d.adultos} adultos`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                  {data.actividadDiaria.length > 1 && (
                    <>
                      <span>{fmtDateShort(data.actividadDiaria[data.actividadDiaria.length - 1].fecha)}</span>
                      <span>{fmtDateShort(data.actividadDiaria[0].fecha)}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">Día</th>
                      <th className="px-4 py-3 text-center">Total intentos</th>
                      <th className="px-4 py-3 text-center">Validaciones OK</th>
                      <th className="px-4 py-3 text-center">Adultos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.actividadDiaria.map((d) => (
                      <tr key={d.fecha} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-gray-600">{fmtDate(d.fecha)}</td>
                        <td className="px-4 py-2.5 text-center">{d.total}</td>
                        <td className="px-4 py-2.5 text-center font-semibold text-green-600">{d.ok}</td>
                        <td className="px-4 py-2.5 text-center text-gray-700">{d.adultos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {/* ── TAB: Historial de suscripciones ───────────────────────── */}
      {tab === 'suscripciones' && (
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b">
            <h2 className="text-sm font-semibold text-gray-700">Historial de suscripciones</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Alta</th>
                  <th className="px-4 py-3 text-left">Expira</th>
                  <th className="px-4 py-3 text-right">Importe</th>
                  <th className="px-4 py-3 text-center">Renovación</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.suscripciones.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <PlanBadge plan={s.tipo} />
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{fmtDate(s.startsAt)}</td>
                    <td className="px-4 py-2.5 text-gray-600">{fmtDate(s.expiresAt)}</td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      {s.importeCents != null ? euros(s.importeCents) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {s.cancelAtPeriodEnd
                        ? <span className="text-xs text-amber-600 font-medium">No renovará</span>
                        : <span className="text-xs text-green-600 font-medium">Automática</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <EstadoBadge estado={s.estado} cancelAtPeriodEnd={s.cancelAtPeriodEnd} />
                    </td>
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

// ─── Subcomponents ──────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: {
  label: string;
  value: string;
  sub?: string;
  color: 'green' | 'blue' | 'purple' | 'amber';
}) {
  const cls: Record<string, string> = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${cls[color]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-1 text-sm font-medium text-gray-700">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
      plan === 'ANUAL' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'
    }`}>
      {plan === 'ANUAL' ? 'Anual' : 'Mensual'}
    </span>
  );
}

function EstadoBadge({ estado, cancelAtPeriodEnd }: { estado: string; cancelAtPeriodEnd: boolean }) {
  if (estado === 'ACTIVA' && cancelAtPeriodEnd)
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Cancela al expirar</span>;
  if (estado === 'ACTIVA')
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Activa</span>;
  if (estado === 'CADUCADA')
    return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Expirada</span>;
  return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Cancelada</span>;
}

function ResultadoBadge({ resultado }: { resultado: string }) {
  if (resultado === 'OK')
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">OK</span>;
  if (resultado === 'CADUCADO')
    return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Caducado</span>;
  if (resultado === 'YA_USADO')
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Ya usado</span>;
  return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">{resultado}</span>;
}
