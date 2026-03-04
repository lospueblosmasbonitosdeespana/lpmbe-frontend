'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Extrae la parte "yyyy-MM-dd" de una fecha (ISO, Date o "dd/MM/yyyy...").
 * Solo devuelve string vacío si no puede parsear.
 */
function extractDate(raw: string | Date | null | undefined): string {
  if (!raw) return '';
  let d: Date;
  if (raw instanceof Date) {
    d = raw;
  } else {
    const s = raw.toString().trim();
    // ISO: 2026-03-21T...
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      d = new Date(s);
    } else {
      // Formato español: "21/03/2026, 07:30" → extraer partes
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

/**
 * Extrae la parte "HH:mm" de una fecha (ISO, Date o "dd/MM/yyyy, HH:mm").
 */
function extractTime(raw: string | Date | null | undefined): string {
  if (!raw) return '';
  let h = 0, min = 0;
  if (raw instanceof Date) {
    h = raw.getHours();
    min = raw.getMinutes();
  } else {
    const s = raw.toString().trim();
    // ISO: ...T07:30...
    const isoMatch = s.match(/T(\d{2}):(\d{2})/);
    if (isoMatch) {
      h = parseInt(isoMatch[1], 10);
      min = parseInt(isoMatch[2], 10);
    } else {
      // Formato español: "21/03/2026, 07:30" o "21/03/2026 07:30"
      const spMatch = s.match(/[\s,]+(\d{1,2}):(\d{2})/);
      if (spMatch) {
        h = parseInt(spMatch[1], 10);
        min = parseInt(spMatch[2], 10);
      }
    }
  }
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Combina "yyyy-MM-dd" + "HH:mm" en un ISO string. Null si alguno está vacío. */
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

  // Separamos fecha y hora para evitar TOTALMENTE el type="datetime-local"
  const [inicioFecha, setInicioFecha] = useState(() => extractDate(inicioProgramadoActual));
  const [inicioHora, setInicioHora] = useState(() => extractTime(inicioProgramadoActual) || '07:00');
  const [finFecha, setFinFecha] = useState(() => extractDate(finProgramadoActual));
  const [finHora, setFinHora] = useState(() => extractTime(finProgramadoActual) || '23:00');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const inicioProgramado = combineToISO(inicioFecha, inicioHora);
    const finProgramado = combineToISO(finFecha, finHora);
    const hasProgramacion = !!(inicioFecha && finFecha);

    if (estado !== 'VERDE' && !hasProgramacion) {
      if (!mensajePublico.trim()) {
        setError('El mensaje público es obligatorio para ROJO/AMARILLO sin programación');
        return;
      }
    }

    if (hasProgramacion && estado !== 'VERDE' && !motivo.trim()) {
      setError('El motivo es obligatorio cuando hay programación');
      return;
    }

    if (hasProgramacion && inicioProgramado && finProgramado) {
      if (new Date(finProgramado) <= new Date(inicioProgramado)) {
        setError('La fecha de fin debe ser posterior a la de inicio');
        return;
      }
    }

    if ((inicioFecha && !finFecha) || (!inicioFecha && finFecha)) {
      setError('Debes especificar ambas fechas o ninguna');
      return;
    }

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

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-md border p-4">
      <h2 className="text-lg font-semibold">Editar semáforo</h2>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-4">
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
            <option value="VERDE">Verde</option>
            <option value="AMARILLO">Amarillo</option>
            <option value="ROJO">Rojo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Motivo{' '}
            <span className="text-xs text-gray-500">
              (obligatorio solo si usas programación de fechas)
            </span>
          </label>
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Ej: Alta afluencia, nieve, obras..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mensaje público</label>
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
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Mensaje solo para gestión"
          />
        </div>

        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <div className="text-sm font-medium text-gray-700">Programación (opcional)</div>
          <div className="mt-3 grid grid-cols-2 gap-6">
            {/* Inicio */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Inicio programado
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={inicioFecha}
                  onChange={(e) => setInicioFecha(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="time"
                  value={inicioHora}
                  onChange={(e) => setInicioHora(e.target.value)}
                  className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            {/* Fin */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Fin programado
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={finFecha}
                  onChange={(e) => setFinFecha(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="time"
                  value={finHora}
                  onChange={(e) => setFinHora(e.target.value)}
                  className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Sin programación: ROJO/AMARILLO duran máximo 7 días (luego se revierte a VERDE).
            Con fechas: el semáforo cambia automáticamente en esos momentos.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={handleResetVerde}
          disabled={loading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Reset a VERDE
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
  );
}
