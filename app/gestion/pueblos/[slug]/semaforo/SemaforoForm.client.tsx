'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** Formatea fecha para input datetime-local (usa hora local, no UTC) */
function toDatetimeLocal(isoOrDate: string | Date | null): string {
  if (!isoOrDate) return '';
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
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
  const [inicioProgramado, setInicioProgramado] = useState(
    toDatetimeLocal(inicioProgramadoActual)
  );
  const [finProgramado, setFinProgramado] = useState(
    toDatetimeLocal(finProgramadoActual)
  );
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
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg = data?.message || data?.error || text || `HTTP ${res.status}`;
        setError(msg);
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

    // Validaciones: ROJO/AMARILLO sin programación requiere mensaje público
    const hasProgramacion = !!(inicioProgramado && finProgramado);
    if (estado !== 'VERDE' && !hasProgramacion) {
      if (!mensajePublico.trim()) {
        setError('El mensaje público es obligatorio para ROJO/AMARILLO sin programación');
        return;
      }
    }

    // Con programación: motivo obligatorio
    if (hasProgramacion && estado !== 'VERDE' && !motivo.trim()) {
      setError('El motivo es obligatorio cuando hay programación');
      return;
    }

    if (inicioProgramado && finProgramado) {
      const inicio = new Date(inicioProgramado);
      const fin = new Date(finProgramado);
      if (fin <= inicio) {
        setError('La fecha de fin debe ser posterior a la de inicio');
        return;
      }
    }

    if ((inicioProgramado && !finProgramado) || (!inicioProgramado && finProgramado)) {
      setError('Debes especificar ambas fechas de programación o ninguna');
      return;
    }

    saveSemaforo({
      estado,
      mensaje: mensaje.trim() || null,
      mensajePublico: mensajePublico.trim() || null,
      motivo: motivo.trim() || null,
      inicioProgramado: inicioProgramado ? new Date(inicioProgramado).toISOString() : null,
      finProgramado: finProgramado ? new Date(finProgramado).toISOString() : null,
    });
  }

  function handleResetVerde() {
    setEstado('VERDE');
    setMensaje('');
    setMensajePublico('');
    setMotivo('');
    setInicioProgramado('');
    setFinProgramado('');
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
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600">Inicio programado</label>
              <input
                type="datetime-local"
                value={inicioProgramado}
                onChange={(e) => setInicioProgramado(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600">Fin programado</label>
              <input
                type="datetime-local"
                value={finProgramado}
                onChange={(e) => setFinProgramado(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
              />
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
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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




























