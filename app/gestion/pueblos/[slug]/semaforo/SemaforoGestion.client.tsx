'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/* ── Helpers de fecha ── */
function extractDate(raw: string | Date | null | undefined): string {
  if (!raw) return '';
  let d: Date;
  if (raw instanceof Date) { d = raw; }
  else {
    const s = raw.toString().trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) d = new Date(s);
    else {
      const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (m) d = new Date(+m[3], +m[2] - 1, +m[1]);
      else d = new Date(s);
    }
  }
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function extractTime(raw: string | Date | null | undefined): string {
  if (!raw) return '';
  if (raw instanceof Date) return `${String(raw.getHours()).padStart(2,'0')}:${String(raw.getMinutes()).padStart(2,'0')}`;
  const s = raw.toString().trim();
  const m = s.match(/T(\d{2}):(\d{2})/) ?? s.match(/[\s,]+(\d{1,2}):(\d{2})/);
  if (m) return `${String(+m[1]).padStart(2,'0')}:${String(+m[2]).padStart(2,'0')}`;
  return '';
}

function combineToISO(date: string, time: string): string | null {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return '—';
  return new Date(d as string).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/* ── Iconos ── */
function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
    </svg>
  );
}
function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IconEdit({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}
function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6"/>
      <path d="M10,11v6"/><path d="M14,11v6"/><path d="M9,6V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/>
    </svg>
  );
}
function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

/* ── Badge de estado ── */
const ESTADO_CFG: Record<string, { label: string; color: string; dot: string; border: string; bg: string }> = {
  VERDE:    { label: 'Verde',    color: 'text-green-800',   dot: 'bg-green-500',  border: 'border-green-200',  bg: 'bg-green-50'  },
  AMARILLO: { label: 'Amarillo', color: 'text-yellow-800',  dot: 'bg-yellow-400', border: 'border-yellow-200', bg: 'bg-yellow-50' },
  ROJO:     { label: 'Rojo',     color: 'text-red-800',     dot: 'bg-red-500',    border: 'border-red-200',    bg: 'bg-red-50'    },
};

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CFG[estado] ?? ESTADO_CFG['VERDE'];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${cfg.bg} ${cfg.border} ${cfg.color}`}>
      <span className={`h-2 w-2 rounded-full ${cfg.dot}`}/>
      {cfg.label}
    </span>
  );
}

/* ── Tipos ── */
type EventoProgramado = {
  id?: string;
  estado: string;
  mensaje: string | null;
  motivo?: string | null;
  inicio: string | Date;
  fin: string | Date;
};

type Props = {
  puebloId: number;
  slug: string;
  estadoManual: string;
  estadoEfectivo: string;
  mensajePublicoManual: string;
  mensajeInternoManual: string;
  caducaEn: string | null;
  ultimaActualizacion: string | null;
  eventosProgramados: EventoProgramado[];
};

/* ── Formulario programado (crear o editar) ── */
function FormularioProgramado({
  evento,
  onSave,
  onCancel,
  loading,
  error,
}: {
  evento?: EventoProgramado | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  const [estado, setEstado] = useState(evento?.estado && evento.estado !== 'VERDE' ? evento.estado : 'AMARILLO');
  const [motivo, setMotivo] = useState(evento?.motivo ?? '');
  const [mensajePublico, setMensajePublico] = useState(evento?.mensaje ?? '');
  const [inicioFecha, setInicioFecha] = useState(() => extractDate(evento?.inicio));
  const [inicioHora, setInicioHora] = useState(() => extractTime(evento?.inicio) || '07:00');
  const [finFecha, setFinFecha] = useState(() => extractDate(evento?.fin));
  const [finHora, setFinHora] = useState(() => extractTime(evento?.fin) || '23:00');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inicioFecha || !finFecha) return;
    if (!motivo.trim() || !mensajePublico.trim()) return;
    const inicio = combineToISO(inicioFecha, inicioHora);
    const fin = combineToISO(finFecha, finHora);
    if (!inicio || !fin || new Date(fin) <= new Date(inicio!)) return;
    onSave({
      estado, motivo: motivo.trim(), mensajePublico: mensajePublico.trim(),
      inicioProgramado: inicio, finProgramado: fin,
      ...(evento?.id ? { eventoId: evento.id } : {}),
    });
  }

  const inputClass = 'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="text-sm font-semibold text-amber-900">
        {evento?.id ? 'Editar evento programado' : 'Nuevo evento programado'}
      </div>

      {error && <div className="rounded-md bg-red-50 border border-red-200 p-2 text-xs text-red-800">{error}</div>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Estado *</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className={inputClass} required>
            <option value="AMARILLO">Amarillo – Atención prevista</option>
            <option value="ROJO">Rojo – Alta afluencia prevista</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Motivo *</label>
          <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)}
            className={inputClass} placeholder="Ej: Vilafest" required />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Mensaje público * (visible durante el evento)</label>
        <textarea value={mensajePublico} onChange={(e) => setMensajePublico(e.target.value)}
          rows={2} className={inputClass} placeholder="Ej: Se verá afectada la movilidad." required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Inicio *</label>
          <div className="flex gap-1">
            <input type="date" value={inicioFecha} onChange={(e) => setInicioFecha(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none" required />
            <input type="time" value={inicioHora} onChange={(e) => setInicioHora(e.target.value)}
              className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none" required />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Fin *</label>
          <div className="flex gap-1">
            <input type="date" value={finFecha} onChange={(e) => setFinFecha(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none" required />
            <input type="time" value={finHora} onChange={(e) => setFinHora(e.target.value)}
              className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none" required />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading}
          className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
          {loading ? 'Guardando...' : (evento?.id ? 'Guardar cambios' : 'Crear evento')}
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* ── Componente principal ── */
export default function SemaforoGestion({
  puebloId, slug,
  estadoManual, estadoEfectivo,
  mensajePublicoManual, mensajeInternoManual,
  caducaEn, ultimaActualizacion,
  eventosProgramados,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Formulario manual
  const [estadoM, setEstadoM] = useState(estadoManual);
  const [mensajePublicoM, setMensajePublicoM] = useState(mensajePublicoManual);
  const [mensajeInternoM, setMensajeInternoM] = useState(mensajeInternoManual);

  // Formulario programado: qué formulario está abierto (null = ninguno, 'new' = nuevo, id = editar)
  const [editandoEvento, setEditandoEvento] = useState<string | null>(null);

  const hayManual = estadoManual !== 'VERDE';

  async function callApi(payload: any) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gestion/pueblos/${puebloId}/semaforo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = null; }
      if (!res.ok) { setError(data?.message || data?.error || text || `HTTP ${res.status}`); return false; }
      router.replace(`/gestion/pueblos/${slug}/semaforo?ts=${Date.now()}`);
      return true;
    } catch (e: any) {
      setError(e?.message || 'Error desconocido'); return false;
    } finally { setLoading(false); }
  }

  function handleSubmitManual(e: React.FormEvent) {
    e.preventDefault();
    if (estadoM !== 'VERDE' && !mensajePublicoM.trim()) {
      setError('El mensaje público es obligatorio para ROJO/AMARILLO'); return;
    }
    setError(null);
    callApi({ estado: estadoM, mensajePublico: mensajePublicoM.trim() || null, mensaje: mensajeInternoM.trim() || null });
  }

  async function handleConfirmReset() {
    setResetting(true);
    const ok = await callApi({ estado: 'VERDE', mensajePublico: null, mensaje: null });
    setResetting(false);
    if (ok) setShowResetModal(false);
  }

  function handleGuardarEvento(data: any) {
    setEditandoEvento(null);
    callApi(data);
  }

  function handleBorrarEvento(eventoId: string) {
    if (!confirm('¿Borrar este evento programado?')) return;
    callApi({ estado: estadoManual, clearProgramado: true, eventoId });
  }

  const inputClass = 'block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <div className="mt-6 space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</div>
      )}

      {/* ── SEMÁFORO EN TIEMPO REAL ── */}
      <section className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className={`flex items-center justify-between gap-2 px-4 py-3 border-b ${ESTADO_CFG[estadoEfectivo]?.bg ?? 'bg-gray-50'} ${ESTADO_CFG[estadoEfectivo]?.border ?? 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <IconClock className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Semáforo en tiempo real</span>
          </div>
          <div className="flex items-center gap-2">
            <EstadoBadge estado={estadoEfectivo} />
            <button
              type="button"
              onClick={() => document.getElementById('form-manual')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <IconEdit className="h-3 w-3" /> Editar
            </button>
          </div>
        </div>

        <div className="px-4 py-3 text-sm text-gray-600 space-y-1">
          {mensajePublicoManual && hayManual && <p>{mensajePublicoManual}</p>}
          {ultimaActualizacion && <p className="text-xs text-gray-400">Actualizado: {formatDate(ultimaActualizacion)}</p>}
          {caducaEn && hayManual && <p className="text-xs text-gray-400">Expira automáticamente: {formatDate(caducaEn)}</p>}
          {!hayManual && !eventosProgramados.length && <p className="text-xs italic text-gray-400">Sin incidencias activas.</p>}
        </div>

        {/* Formulario edición manual */}
        <form id="form-manual" onSubmit={handleSubmitManual} className="border-t border-gray-100 px-4 py-4 space-y-3 bg-gray-50">
          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded p-2">
            Cambia el semáforo <strong>ahora mismo</strong>. Los eventos programados se mantienen independientemente.
            ROJO/AMARILLO caducan a los 7 días si no se quitan.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Estado *</label>
              <select value={estadoM} onChange={(e) => setEstadoM(e.target.value)} className={inputClass} required>
                <option value="VERDE">Verde – Sin incidencias</option>
                <option value="AMARILLO">Amarillo – Atención</option>
                <option value="ROJO">Rojo – Alta afluencia</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mensaje público{estadoM !== 'VERDE' && <span className="text-red-500"> *</span>}
              </label>
              <input type="text" value={mensajePublicoM} onChange={(e) => setMensajePublicoM(e.target.value)}
                className={inputClass} placeholder="Visible para el público" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mensaje interno (solo gestión)</label>
            <input type="text" value={mensajeInternoM} onChange={(e) => setMensajeInternoM(e.target.value)}
              className={inputClass} placeholder="Notas internas" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar estado manual'}
            </button>
            {hayManual && (
              <button type="button" onClick={() => setShowResetModal(true)} disabled={loading}
                className="rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50">
                Reset a VERDE
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Modal de confirmación para Reset a VERDE */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !resetting && setShowResetModal(false)}>
          <div className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Restablecer semáforo</h3>
            </div>
            <p className="mb-2 text-sm text-gray-600">
              Esto cambiará el semáforo a <strong className="text-green-700">VERDE</strong> y borrará el estado actual (mensaje público, mensaje interno y motivo).
            </p>
            <p className="mb-5 text-xs text-gray-500">
              Los eventos programados futuros se mantendrán sin cambios.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={resetting}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={resetting}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {resetting ? 'Restableciendo...' : 'Sí, poner en VERDE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EVENTOS PROGRAMADOS ── */}
      <section className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <IconCalendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">
              Eventos programados ({eventosProgramados.length})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setEditandoEvento(editandoEvento === 'new' ? null : 'new')}
            className="flex items-center gap-1 rounded-md bg-amber-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-700"
          >
            <IconPlus className="h-3 w-3" /> Nuevo evento
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {/* Formulario nuevo evento */}
          {editandoEvento === 'new' && (
            <div className="p-4">
              <FormularioProgramado
                onSave={handleGuardarEvento}
                onCancel={() => setEditandoEvento(null)}
                loading={loading}
                error={null}
              />
            </div>
          )}

          {/* Lista de eventos existentes */}
          {eventosProgramados.length === 0 && editandoEvento !== 'new' && (
            <p className="px-4 py-4 text-sm text-gray-400 italic">No hay eventos programados.</p>
          )}

          {eventosProgramados.map((ev, i) => {
            const cfg = ESTADO_CFG[ev.estado] ?? ESTADO_CFG['VERDE'];
            const estaEditando = editandoEvento === (ev.id ?? `idx-${i}`);
            return (
              <div key={ev.id ?? i} className="px-4 py-3">
                {estaEditando ? (
                  <FormularioProgramado
                    evento={ev}
                    onSave={handleGuardarEvento}
                    onCancel={() => setEditandoEvento(null)}
                    loading={loading}
                    error={null}
                  />
                ) : (
                  <div className={`rounded-lg border p-3 ${cfg.bg} ${cfg.border}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <EstadoBadge estado={ev.estado} />
                          {ev.motivo && <span className={`text-sm font-medium ${cfg.color}`}>{ev.motivo}</span>}
                        </div>
                        {ev.mensaje && <p className={`text-sm ${cfg.color}`}>{ev.mensaje}</p>}
                        <p className="mt-1 text-xs opacity-70">{formatDate(ev.inicio)} → {formatDate(ev.fin)}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditandoEvento(ev.id ?? `idx-${i}`)}
                          className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          <IconEdit className="h-3 w-3" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => ev.id && handleBorrarEvento(ev.id)}
                          className="flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          <IconTrash className="h-3 w-3" /> Borrar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
