'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    inicioProgramadoActual ? new Date(inicioProgramadoActual).toISOString().slice(0, 16) : ''
  );
  const [finProgramado, setFinProgramado] = useState(
    finProgramadoActual ? new Date(finProgramadoActual).toISOString().slice(0, 16) : ''
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

    // Validaciones
    if (estado !== 'VERDE' && !motivo.trim()) {
      setError('El motivo es obligatorio para estados AMARILLO y ROJO');
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
            Motivo <span className="text-red-500">*</span>{' '}
            <span className="text-xs text-gray-500">(obligatorio para AMARILLO/ROJO)</span>
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
            Si especificas fechas, el semáforo cambiará automáticamente en esos momentos.
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




















