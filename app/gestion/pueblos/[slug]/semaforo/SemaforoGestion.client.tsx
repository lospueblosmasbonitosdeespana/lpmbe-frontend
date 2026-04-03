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
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold shadow-sm ${cfg.bg} ${cfg.border} ${cfg.color}`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const field =
  'block w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20';

const btnPrimary =
  'inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#a0705a] to-[#b8856d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';

const btnSecondary =
  'inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-50';

const btnAmber =
  'inline-flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-95 active:scale-[0.98] disabled:opacity-50';

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

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/90 to-white p-5 shadow-sm ring-1 ring-amber-100/60"
    >
      <div className="text-sm font-bold text-amber-950">
        {evento?.id ? 'Editar evento programado' : 'Nuevo evento programado'}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50/90 p-3 text-xs text-red-800">{error}</div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Estado *</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className={field} required>
            <option value="AMARILLO">Amarillo – Atención prevista</option>
            <option value="ROJO">Rojo – Alta afluencia prevista</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Motivo *</label>
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className={field}
            placeholder="Ej: Vilafest"
            required
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Mensaje público * (visible durante el evento)
        </label>
        <textarea
          value={mensajePublico}
          onChange={(e) => setMensajePublico(e.target.value)}
          rows={2}
          className={field}
          placeholder="Ej: Se verá afectada la movilidad."
          required
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Inicio *</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={inicioFecha}
              onChange={(e) => setInicioFecha(e.target.value)}
              className={`${field} flex-1`}
              required
            />
            <input
              type="time"
              value={inicioHora}
              onChange={(e) => setInicioHora(e.target.value)}
              className={`${field} w-24 shrink-0`}
              required
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Fin *</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={finFecha}
              onChange={(e) => setFinFecha(e.target.value)}
              className={`${field} flex-1`}
              required
            />
            <input
              type="time"
              value={finHora}
              onChange={(e) => setFinHora(e.target.value)}
              className={`${field} w-24 shrink-0`}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" disabled={loading} className={btnAmber}>
          {loading ? 'Guardando...' : evento?.id ? 'Guardar cambios' : 'Crear evento'}
        </button>
        <button type="button" onClick={onCancel} className={btnSecondary}>
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

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 shadow-sm">{error}</div>
      )}

      {/* ── SEMÁFORO EN TIEMPO REAL ── */}
      <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md shadow-black/5">
        <div
          className={`flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${ESTADO_CFG[estadoEfectivo]?.bg ?? 'bg-muted/40'} ${ESTADO_CFG[estadoEfectivo]?.border ?? 'border-border'}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background/60 shadow-sm ring-1 ring-border/50">
              <IconClock className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">Semáforo en tiempo real</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <EstadoBadge estado={estadoEfectivo} />
            <button
              type="button"
              onClick={() => document.getElementById('form-manual')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
            >
              <IconEdit className="h-3.5 w-3.5" /> Editar
            </button>
          </div>
        </div>

        <div className="space-y-1 px-5 py-4 text-sm text-muted-foreground">
          {mensajePublicoManual && hayManual && <p className="text-foreground/90">{mensajePublicoManual}</p>}
          {ultimaActualizacion && (
            <p className="text-xs text-muted-foreground/80">Actualizado: {formatDate(ultimaActualizacion)}</p>
          )}
          {caducaEn && hayManual && (
            <p className="text-xs text-muted-foreground/80">Expira automáticamente: {formatDate(caducaEn)}</p>
          )}
          {!hayManual && !eventosProgramados.length && (
            <p className="text-xs italic text-muted-foreground">Sin incidencias activas.</p>
          )}
        </div>

        {/* Formulario edición manual */}
        <form
          id="form-manual"
          onSubmit={handleSubmitManual}
          className="space-y-4 border-t border-border/60 bg-muted/25 px-5 py-5"
        >
          <p className="rounded-xl border border-sky-200/80 bg-sky-50/90 p-3 text-xs leading-relaxed text-sky-950">
            Cambia el semáforo <strong>ahora mismo</strong>. Los eventos programados se mantienen independientemente.
            ROJO/AMARILLO caducan a los 7 días si no se quitan.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Estado *</label>
              <select value={estadoM} onChange={(e) => setEstadoM(e.target.value)} className={field} required>
                <option value="VERDE">Verde – Sin incidencias</option>
                <option value="AMARILLO">Amarillo – Atención</option>
                <option value="ROJO">Rojo – Alta afluencia</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Mensaje público{estadoM !== 'VERDE' && <span className="text-destructive"> *</span>}
              </label>
              <input
                type="text"
                value={mensajePublicoM}
                onChange={(e) => setMensajePublicoM(e.target.value)}
                className={field}
                placeholder="Visible para el público"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Mensaje interno (solo gestión)</label>
            <input
              type="text"
              value={mensajeInternoM}
              onChange={(e) => setMensajeInternoM(e.target.value)}
              className={field}
              placeholder="Notas internas"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={loading} className={btnPrimary}>
              {loading ? 'Guardando...' : 'Guardar estado manual'}
            </button>
            {hayManual && (
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition-colors hover:bg-emerald-100 disabled:opacity-50"
              >
                Reset a VERDE
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Modal de confirmación para Reset a VERDE */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
          onClick={() => !resetting && setShowResetModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 ring-1 ring-emerald-200/60">
                <svg
                  className="h-5 w-5 text-emerald-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground">Restablecer semáforo</h3>
            </div>
            <p className="mb-2 text-sm text-muted-foreground">
              Esto cambiará el semáforo a <strong className="text-emerald-700">VERDE</strong> y borrará el estado
              actual (mensaje público, mensaje interno y motivo).
            </p>
            <p className="mb-5 text-xs text-muted-foreground">Los eventos programados futuros se mantendrán sin cambios.</p>
            <div className="flex justify-end gap-2 sm:gap-3">
              <button type="button" onClick={() => setShowResetModal(false)} disabled={resetting} className={btnSecondary}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={resetting}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {resetting ? 'Restableciendo...' : 'Sí, poner en VERDE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EVENTOS PROGRAMADOS ── */}
      <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md shadow-black/5">
        <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100/80 shadow-sm ring-1 ring-amber-200/50">
              <IconCalendar className="h-4 w-4 text-amber-800/90" />
            </div>
            <span className="text-sm font-bold text-foreground">
              Eventos programados ({eventosProgramados.length})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setEditandoEvento(editandoEvento === 'new' ? null : 'new')}
            className={btnAmber}
          >
            <IconPlus className="h-3.5 w-3.5" /> Nuevo evento
          </button>
        </div>

        <div className="divide-y divide-border/60">
          {/* Formulario nuevo evento */}
          {editandoEvento === 'new' && (
            <div className="p-5">
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
            <p className="px-5 py-8 text-center text-sm italic text-muted-foreground">No hay eventos programados.</p>
          )}

          {eventosProgramados.map((ev, i) => {
            const cfg = ESTADO_CFG[ev.estado] ?? ESTADO_CFG['VERDE'];
            const estaEditando = editandoEvento === (ev.id ?? `idx-${i}`);
            return (
              <div key={ev.id ?? i} className="px-5 py-4">
                {estaEditando ? (
                  <FormularioProgramado
                    evento={ev}
                    onSave={handleGuardarEvento}
                    onCancel={() => setEditandoEvento(null)}
                    loading={loading}
                    error={null}
                  />
                ) : (
                  <div
                    className={`rounded-xl border p-4 shadow-sm ring-1 ring-black/[0.03] ${cfg.bg} ${cfg.border}`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <EstadoBadge estado={ev.estado} />
                          {ev.motivo && <span className={`text-sm font-semibold ${cfg.color}`}>{ev.motivo}</span>}
                        </div>
                        {ev.mensaje && <p className={`text-sm ${cfg.color}`}>{ev.mensaje}</p>}
                        <p className="mt-2 text-xs opacity-80">
                          {formatDate(ev.inicio)} → {formatDate(ev.fin)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditandoEvento(ev.id ?? `idx-${i}`)}
                          className="inline-flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <IconEdit className="h-3.5 w-3.5" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => ev.id && handleBorrarEvento(ev.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 shadow-sm transition-colors hover:bg-red-100"
                        >
                          <IconTrash className="h-3.5 w-3.5" /> Borrar
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
