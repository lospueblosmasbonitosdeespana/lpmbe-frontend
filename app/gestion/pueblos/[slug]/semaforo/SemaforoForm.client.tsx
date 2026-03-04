'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/* ── Helpers de fecha ── */
function extractDate(raw: string | Date | null | undefined): string {
  if (!raw) return '';
  let d: Date;
  if (raw instanceof Date) {
    d = raw;
  } else {
    const s = raw.toString().trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      d = new Date(s);
    } else {
      const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        const [, day, month, year] = match;
        d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      } else {
        d = new Date(s);
      }
    }
  }
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function extractTime(raw: string | Date | null | undefined): string {
  if (!raw) return '';
  let h = 0, min = 0;
  if (raw instanceof Date) {
    h = raw.getHours(); min = raw.getMinutes();
  } else {
    const s = raw.toString().trim();
    const isoMatch = s.match(/T(\d{2}):(\d{2})/);
    if (isoMatch) { h = parseInt(isoMatch[1], 10); min = parseInt(isoMatch[2], 10); }
    else {
      const spMatch = s.match(/[\s,]+(\d{1,2}):(\d{2})/);
      if (spMatch) { h = parseInt(spMatch[1], 10); min = parseInt(spMatch[2], 10); }
    }
  }
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function combineToISO(date: string, time: string): string | null {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/* ── Iconos del diseño de la web ── */
function IconTiempoReal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}
function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

/* ── Props ── */
type SemaforoFormProps = {
  puebloId: number;
  slug: string;
  // Manual
  estadoManualActual: string;
  mensajePublicoManualActual: string;
  mensajeInternoActual: string;
  hayManualActivo: boolean;
  // Programado
  estadoProgramadoActual: string;
  mensajePublicoProgramadoActual: string;
  motivoProgramadoActual: string;
  inicioProgramadoActual: string | null;
  finProgramadoActual: string | null;
  hayProgramadoActivo: boolean;
};

export default function SemaforoForm({
  puebloId,
  slug,
  estadoManualActual,
  mensajePublicoManualActual,
  mensajeInternoActual,
  hayManualActivo,
  estadoProgramadoActual,
  mensajePublicoProgramadoActual,
  motivoProgramadoActual,
  inicioProgramadoActual,
  finProgramadoActual,
  hayProgramadoActivo,
}: SemaforoFormProps) {
  const router = useRouter();

  // Tab activo: manual si hay override manual, programado si solo hay evento futuro
  const [tab, setTab] = useState<'manual' | 'programado'>(
    hayManualActivo ? 'manual' : (hayProgramadoActivo ? 'programado' : 'manual')
  );

  // Estado del formulario manual
  const [estadoManual, setEstadoManual] = useState(estadoManualActual);
  const [mensajePublicoManual, setMensajePublicoManual] = useState(mensajePublicoManualActual);
  const [mensajeInterno, setMensajeInterno] = useState(mensajeInternoActual);

  // Estado del formulario programado
  const [estadoProgramado, setEstadoProgramado] = useState(
    estadoProgramadoActual === 'VERDE' ? 'AMARILLO' : estadoProgramadoActual
  );
  const [mensajePublicoProgramado, setMensajePublicoProgramado] = useState(mensajePublicoProgramadoActual);
  const [motivoProgramado, setMotivoProgramado] = useState(motivoProgramadoActual);
  const [inicioFecha, setInicioFecha] = useState(() => extractDate(inicioProgramadoActual));
  const [inicioHora, setInicioHora] = useState(() => extractTime(inicioProgramadoActual) || '07:00');
  const [finFecha, setFinFecha] = useState(() => extractDate(finProgramadoActual));
  const [finHora, setFinHora] = useState(() => extractTime(finProgramadoActual) || '23:00');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function callApi(payload: {
    estado: string;
    mensaje?: string | null;
    mensajePublico?: string | null;
    motivo?: string | null;
    inicioProgramado?: string | null;
    finProgramado?: string | null;
  }) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gestion/pueblos/${puebloId}/semaforo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
        redirect: 'follow',
      });
      const text = await res.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch { data = null; }
      if (!res.ok) {
        setError(data?.message || data?.error || text || `HTTP ${res.status}`);
        return;
      }
      router.replace(`/gestion/pueblos/${slug}/semaforo?ts=${Date.now()}`);
    } catch (e: any) {
      setError(e?.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  /* ── Submit manual ── */
  function handleSubmitManual(e: React.FormEvent) {
    e.preventDefault();
    if (estadoManual !== 'VERDE' && !mensajePublicoManual.trim()) {
      setError('El mensaje público es obligatorio para ROJO/AMARILLO');
      return;
    }
    setError(null);
    callApi({
      estado: estadoManual,
      mensaje: mensajeInterno.trim() || null,
      mensajePublico: mensajePublicoManual.trim() || null,
      // NO enviamos fechas de programación → backend preservará el programado existente
      inicioProgramado: null,
      finProgramado: null,
    });
  }

  /* ── Submit programado ── */
  function handleSubmitProgramado(e: React.FormEvent) {
    e.preventDefault();
    if (!inicioFecha || !finFecha) { setError('Debes especificar ambas fechas'); return; }
    if (!motivoProgramado.trim()) { setError('El motivo es obligatorio'); return; }
    if (!mensajePublicoProgramado.trim()) { setError('El mensaje público es obligatorio'); return; }
    const inicioProgramado = combineToISO(inicioFecha, inicioHora);
    const finProgramado = combineToISO(finFecha, finHora);
    if (!inicioProgramado || !finProgramado) { setError('Fechas inválidas'); return; }
    if (new Date(finProgramado) <= new Date(inicioProgramado)) {
      setError('La fecha de fin debe ser posterior a la de inicio');
      return;
    }
    setError(null);
    callApi({
      estado: estadoProgramado,
      mensajePublico: mensajePublicoProgramado.trim(),
      motivo: motivoProgramado.trim(),
      inicioProgramado,
      finProgramado,
    });
  }

  /* ── Reset manual a VERDE (solo borra el estado manual) ── */
  function handleResetManualVerde() {
    if (!confirm('¿Poner el semáforo en tiempo real a VERDE? El evento programado futuro (si existe) se mantendrá.')) return;
    setEstadoManual('VERDE');
    setMensajePublicoManual('');
    setMensajeInterno('');
    setError(null);
    // Estado VERDE sin fechas → backend preserva el programado futuro
    callApi({ estado: 'VERDE', mensaje: null, mensajePublico: null, motivo: null, inicioProgramado: null, finProgramado: null });
  }

  /* ── Borrar evento programado ── */
  function handleBorrarProgramado() {
    if (!confirm('¿Borrar el evento programado? El semáforo en tiempo real no cambiará.')) return;
    setInicioFecha(''); setInicioHora('07:00');
    setFinFecha(''); setFinHora('23:00');
    setMensajePublicoProgramado(''); setMotivoProgramado('');
    setError(null);
    callApi({
      estado: estadoManual,
      clearProgramado: true,
    } as any);
  }

  const tabClass = (active: boolean) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
      active
        ? 'border-primary text-primary'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button type="button" className={tabClass(tab === 'manual')} onClick={() => { setTab('manual'); setError(null); }}>
          <IconTiempoReal className="h-4 w-4" />
          Tiempo real (manual)
        </button>
        <button type="button" className={tabClass(tab === 'programado')} onClick={() => { setTab('programado'); setError(null); }}>
          <IconCalendar className="h-4 w-4" />
          Evento programado
        </button>
      </div>

      <div className="p-5">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* ── TAB MANUAL ── */}
        {tab === 'manual' && (
          <form onSubmit={handleSubmitManual} className="space-y-4">
            <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-md p-3 leading-relaxed">
              Cambia el semáforo <strong>ahora mismo</strong>. Si hay un evento programado futuro,
              se mantiene independientemente. ROJO/AMARILLO caducan automáticamente a los 7 días si no se quitan antes.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                value={estadoManual}
                onChange={(e) => setEstadoManual(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                <option value="VERDE">Verde – Sin incidencias</option>
                <option value="AMARILLO">Amarillo – Atención</option>
                <option value="ROJO">Rojo – Alta afluencia / incidencia</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje público{estadoManual !== 'VERDE' && <span className="text-red-500"> *</span>}
                <span className="text-xs text-gray-400 ml-1">(visible para todos)</span>
              </label>
              <textarea
                value={mensajePublicoManual}
                onChange={(e) => setMensajePublicoManual(e.target.value)}
                rows={3}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ej: Alta afluencia prevista este fin de semana. Recomendamos llegar antes de las 10h."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje interno
                <span className="text-xs text-gray-400 ml-1">(solo para gestión)</span>
              </label>
              <textarea
                value={mensajeInterno}
                onChange={(e) => setMensajeInterno(e.target.value)}
                rows={2}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Notas internas para el equipo"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar estado manual'}
              </button>
              <button
                type="button"
                onClick={handleResetManualVerde}
                disabled={loading}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Reset a VERDE
              </button>
            </div>
          </form>
        )}

        {/* ── TAB PROGRAMADO ── */}
        {tab === 'programado' && (
          <form onSubmit={handleSubmitProgramado} className="space-y-4">
            <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-md p-3 leading-relaxed">
              Programa un evento <strong>futuro</strong>. El semáforo en tiempo real no cambia hasta la fecha de inicio.
              Si hay un estado manual activo (ROJO/AMARILLO), el evento programado se mostrará como aviso separado.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado del evento <span className="text-red-500">*</span>
              </label>
              <select
                value={estadoProgramado}
                onChange={(e) => setEstadoProgramado(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                <option value="AMARILLO">Amarillo – Atención prevista</option>
                <option value="ROJO">Rojo – Alta afluencia prevista</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={motivoProgramado}
                onChange={(e) => setMotivoProgramado(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ej: Vilafest (Festival de Música)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje público <span className="text-red-500">*</span>
                <span className="text-xs text-gray-400 ml-1">(visible durante el evento)</span>
              </label>
              <textarea
                value={mensajePublicoProgramado}
                onChange={(e) => setMensajePublicoProgramado(e.target.value)}
                rows={3}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Ej: Vilafest (Festival de Música). Se verá afectada la movilidad."
                required
              />
            </div>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm font-medium text-gray-700 mb-3">Fechas del evento</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Inicio</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={inicioFecha}
                      onChange={(e) => setInicioFecha(e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                    <input
                      type="time"
                      value={inicioHora}
                      onChange={(e) => setInicioHora(e.target.value)}
                      className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fin</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={finFecha}
                      onChange={(e) => setFinFecha(e.target.value)}
                      className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                    <input
                      type="time"
                      value={finHora}
                      onChange={(e) => setFinHora(e.target.value)}
                      className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar evento programado'}
              </button>
              {hayProgramadoActivo && (
                <button
                  type="button"
                  onClick={handleBorrarProgramado}
                  disabled={loading}
                  className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  Borrar evento programado
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
