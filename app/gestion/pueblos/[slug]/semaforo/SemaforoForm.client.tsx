'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function extractTime(raw: string | Date | null | undefined): string {
  if (!raw) return '';
  let h = 0, min = 0;
  if (raw instanceof Date) {
    h = raw.getHours();
    min = raw.getMinutes();
  } else {
    const s = raw.toString().trim();
    const isoMatch = s.match(/T(\d{2}):(\d{2})/);
    if (isoMatch) {
      h = parseInt(isoMatch[1], 10);
      min = parseInt(isoMatch[2], 10);
    } else {
      const spMatch = s.match(/[\s,]+(\d{1,2}):(\d{2})/);
      if (spMatch) {
        h = parseInt(spMatch[1], 10);
        min = parseInt(spMatch[2], 10);
      }
    }
  }
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function combineToISO(date: string, time: string): string | null {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

type SemaforoFormProps = {
  puebloId: number;
  slug: string;
  estadoActual: string;
  mensajeActual: string;
  mensajePublicoActual: string;
  motivoActual: string;
  inicioProgramadoActual: string | null;
  finProgramadoActual: string | null;
};

export default function SemaforoForm({
  puebloId,
  slug,
  estadoActual,
  mensajeActual,
  mensajePublicoActual,
  motivoActual,
  inicioProgramadoActual,
  finProgramadoActual,
}: SemaforoFormProps) {
  const router = useRouter();
  const [estado, setEstado] = useState(estadoActual);
  const [mensaje, setMensaje] = useState(mensajeActual);
  const [mensajePublico, setMensajePublico] = useState(mensajePublicoActual);
  const [motivo, setMotivo] = useState(motivoActual);

  const [inicioFecha, setInicioFecha] = useState(() => extractDate(inicioProgramadoActual));
  const [inicioHora, setInicioHora] = useState(() => extractTime(inicioProgramadoActual) || '07:00');
  const [finFecha, setFinFecha] = useState(() => extractDate(finProgramadoActual));
  const [finHora, setFinHora] = useState(() => extractTime(finProgramadoActual) || '23:00');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tabs: "manual" (tiempo real) o "programado" (evento futuro)
  const [tab, setTab] = useState<'manual' | 'programado'>(
    inicioProgramadoActual ? 'programado' : 'manual'
  );

  async function saveSemaforo(payload: {
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

  function handleSubmitManual(e: React.FormEvent) {
    e.preventDefault();
    if (estado !== 'VERDE' && !mensajePublico.trim()) {
      setError('El mensaje público es obligatorio para ROJO/AMARILLO');
      return;
    }
    setError(null);
    // Actualización manual en tiempo real: NO envía fechas de programación
    // El backend preservará el evento programado existente si es futuro
    saveSemaforo({
      estado,
      mensaje: mensaje.trim() || null,
      mensajePublico: mensajePublico.trim() || null,
      motivo: motivo.trim() || null,
      inicioProgramado: null,
      finProgramado: null,
    });
  }

  function handleSubmitProgramado(e: React.FormEvent) {
    e.preventDefault();
    if (!inicioFecha || !finFecha) {
      setError('Debes especificar ambas fechas');
      return;
    }
    if (!motivo.trim()) {
      setError('El motivo es obligatorio cuando hay programación');
      return;
    }
    if (!mensajePublico.trim()) {
      setError('El mensaje público es obligatorio para el evento programado');
      return;
    }
    const inicioProgramado = combineToISO(inicioFecha, inicioHora);
    const finProgramado = combineToISO(finFecha, finHora);
    if (!inicioProgramado || !finProgramado) {
      setError('Fechas inválidas');
      return;
    }
    if (new Date(finProgramado) <= new Date(inicioProgramado)) {
      setError('La fecha de fin debe ser posterior a la de inicio');
      return;
    }
    setError(null);
    // Programar evento futuro: el estado en tiempo real NO cambia
    saveSemaforo({
      estado,
      mensaje: mensaje.trim() || null,
      mensajePublico: mensajePublico.trim() || null,
      motivo: motivo.trim() || null,
      inicioProgramado,
      finProgramado,
    });
  }

  function handleResetVerde() {
    setEstado('VERDE');
    setMensaje('');
    setMensajePublico('');
    setMotivo('');
    setInicioFecha('');
    setInicioHora('07:00');
    setFinFecha('');
    setFinHora('23:00');
    setError(null);
    saveSemaforo({
      estado: 'VERDE',
      mensaje: null,
      mensajePublico: null,
      motivo: null,
      inicioProgramado: null,
      finProgramado: null,
    });
  }

  function handleBorrarMensaje() {
    setMensaje('');
    setMensajePublico('');
  }

  const tabClass = (active: boolean) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      active
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  return (
    <div className="rounded-md border p-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          type="button"
          className={tabClass(tab === 'manual')}
          onClick={() => { setTab('manual'); setError(null); }}
        >
          ⚡ Tiempo real (manual)
        </button>
        <button
          type="button"
          className={tabClass(tab === 'programado')}
          onClick={() => { setTab('programado'); setError(null); }}
        >
          📅 Evento programado
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* ── TAB: MANUAL ── */}
      {tab === 'manual' && (
        <form onSubmit={handleSubmitManual} className="space-y-4">
          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded p-2">
            Cambia el semáforo <strong>ahora mismo</strong>. Si hay un evento programado futuro, se mantiene independientemente.
            ROJO/AMARILLO sin fecha caducan automáticamente a los 7 días.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estado <span className="text-red-500">*</span>
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="VERDE">Verde – Sin incidencias</option>
              <option value="AMARILLO">Amarillo – Atención</option>
              <option value="ROJO">Rojo – Alta afluencia / incidencia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mensaje público <span className="text-xs text-gray-500">(obligatorio si no es verde)</span>
            </label>
            <textarea
              value={mensajePublico}
              onChange={(e) => setMensajePublico(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Mensaje visible para el público"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mensaje interno</label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Mensaje solo para gestión interna"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar estado manual'}
            </button>
            <button
              type="button"
              onClick={handleResetVerde}
              disabled={loading}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Reset a VERDE (borra todo)
            </button>
            <button
              type="button"
              onClick={handleBorrarMensaje}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Borrar mensaje
            </button>
          </div>
        </form>
      )}

      {/* ── TAB: PROGRAMADO ── */}
      {tab === 'programado' && (
        <form onSubmit={handleSubmitProgramado} className="space-y-4">
          <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded p-2">
            Programa un evento <strong>futuro</strong>. El semáforo en tiempo real no cambia hasta que llegue la fecha de inicio.
            Si ya hay un estado manual activo (ROJO/AMARILLO), el evento programado se verá como aviso debajo.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Estado del evento <span className="text-red-500">*</span>
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="AMARILLO">Amarillo – Atención prevista</option>
              <option value="ROJO">Rojo – Alta afluencia prevista</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Motivo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Ej: Vilafest (Festival de Música)"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mensaje público <span className="text-red-500">*</span>
            </label>
            <textarea
              value={mensajePublico}
              onChange={(e) => setMensajePublico(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Mensaje visible para el público durante el evento"
              required
            />
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm font-medium text-gray-700 mb-3">Fechas del evento</div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Inicio</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={inicioFecha}
                    onChange={(e) => setInicioFecha(e.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    required
                  />
                  <input
                    type="time"
                    value={inicioHora}
                    onChange={(e) => setInicioHora(e.target.value)}
                    className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
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
                    className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    required
                  />
                  <input
                    type="time"
                    value={finHora}
                    onChange={(e) => setFinHora(e.target.value)}
                    className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar evento programado'}
            </button>
            <button
              type="button"
              onClick={handleResetVerde}
              disabled={loading}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Reset a VERDE (borra todo)
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
