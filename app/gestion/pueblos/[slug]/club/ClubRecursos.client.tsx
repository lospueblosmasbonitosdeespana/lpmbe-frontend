'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Recurso = {
  id: number;
  nombre: string;
  tipo: string;
  descuentoPorcentaje?: number | null;
  activo: boolean;
  codigoQr: string;
  puebloId: number;
};

export default function ClubRecursos({ puebloId, slug }: { puebloId: number; slug: string }) {
  const router = useRouter();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form nuevo recurso
  const [showForm, setShowForm] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('');
  const [nuevoDescuento, setNuevoDescuento] = useState('');
  const [nuevoActivo, setNuevoActivo] = useState(true);
  const [creando, setCreando] = useState(false);

  // Edición
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTipo, setEditTipo] = useState('');
  const [editDescuento, setEditDescuento] = useState('');
  const [editActivo, setEditActivo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Cargar recursos
  async function loadRecursos() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/club/recursos/pueblo/${puebloId}`);

      if (res.status === 401) {
        window.location.href = '/entrar';
        return;
      }

      if (res.status === 502) {
        const errorData = await res.json().catch(() => null);
        if (errorData?.error === 'upstream_fetch_failed') {
          setError(`No se pudo conectar al backend. Verifica que el servidor esté ejecutándose.`);
        } else {
          setError('El backend no está disponible.');
        }
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorText = errorData?.error || await res.text().catch(() => 'Error cargando recursos');
        setError(errorText);
        return;
      }

      const data = await res.json();
      setRecursos(Array.isArray(data) ? data : data.items || []);
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecursos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puebloId]);

  async function handleCrear() {
    if (!nuevoNombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (nuevoDescuento && (isNaN(Number(nuevoDescuento)) || Number(nuevoDescuento) < 0 || Number(nuevoDescuento) > 100)) {
      setError('El descuento debe ser un número entre 0 y 100');
      return;
    }

    setCreando(true);
    setError(null);

    try {
      const body: any = {
        nombre: nuevoNombre.trim(),
        tipo: nuevoTipo.trim() || null,
        activo: nuevoActivo,
      };

      if (nuevoDescuento) {
        body.descuentoPorcentaje = Number(nuevoDescuento);
      }

      const res = await fetch(`/api/club/recursos/pueblo/${puebloId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorText = errorData?.error || await res.text().catch(() => 'Error creando recurso');
        setError(errorText);
        return;
      }

      setNuevoNombre('');
      setNuevoTipo('');
      setNuevoDescuento('');
      setNuevoActivo(true);
      setShowForm(false);
      await loadRecursos();
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    } finally {
      setCreando(false);
    }
  }

  function handleIniciarEdicion(r: Recurso) {
    setEditandoId(r.id);
    setEditNombre(r.nombre);
    setEditTipo(r.tipo || '');
    setEditDescuento(r.descuentoPorcentaje?.toString() || '');
    setEditActivo(r.activo);
  }

  function handleCancelarEdicion() {
    setEditandoId(null);
    setEditNombre('');
    setEditTipo('');
    setEditDescuento('');
    setEditActivo(false);
  }

  async function handleGuardar(id: number) {
    if (!editNombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (editDescuento && (isNaN(Number(editDescuento)) || Number(editDescuento) < 0 || Number(editDescuento) > 100)) {
      setError('El descuento debe ser un número entre 0 y 100');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const body: any = {
        nombre: editNombre.trim(),
        tipo: editTipo.trim() || null,
        activo: editActivo,
      };

      if (editDescuento) {
        body.descuentoPorcentaje = Number(editDescuento);
      } else {
        body.descuentoPorcentaje = null;
      }

      const res = await fetch(`/api/club/recursos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorText = errorData?.error || await res.text().catch(() => 'Error guardando recurso');
        setError(errorText);
        return;
      }

      handleCancelarEdicion();
      await loadRecursos();
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id: number) {
    if (!confirm('¿Estás seguro de eliminar este recurso?')) return;

    setError(null);

    try {
      const res = await fetch(`/api/club/recursos/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorText = errorData?.error || await res.text().catch(() => 'Error eliminando recurso');
        setError(errorText);
        return;
      }

      await loadRecursos();
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    }
  }

  async function handleToggleActivo(id: number, activo: boolean) {
    setError(null);

    try {
      const res = await fetch(`/api/club/recursos/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activo: !activo }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const errorText = errorData?.error || await res.text().catch(() => 'Error actualizando recurso');
        setError(errorText);
        return;
      }

      await loadRecursos();
    } catch (e: any) {
      setError(e?.message ?? 'Error desconocido');
    }
  }

  return (
    <>
      {error && (
        <div className="mt-4 p-3 border rounded text-sm text-red-600 bg-red-50">
          {error}
        </div>
      )}

      {/* Form nuevo recurso */}
      {!showForm ? (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm border rounded hover:bg-gray-50"
          >
            + Nuevo recurso
          </button>
        </div>
      ) : (
        <div className="mt-6 p-4 border rounded space-y-3">
          <h2 className="font-medium">Nuevo recurso</h2>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nombre *</label>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              disabled={creando}
              className="w-full px-3 py-2 border rounded disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Tipo</label>
            <input
              type="text"
              value={nuevoTipo}
              onChange={(e) => setNuevoTipo(e.target.value)}
              disabled={creando}
              className="w-full px-3 py-2 border rounded disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Descuento (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={nuevoDescuento}
              onChange={(e) => setNuevoDescuento(e.target.value)}
              disabled={creando}
              className="w-full px-3 py-2 border rounded disabled:opacity-50"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={nuevoActivo}
              onChange={(e) => setNuevoActivo(e.target.checked)}
              disabled={creando}
              className="disabled:opacity-50"
            />
            <label className="text-sm text-gray-600">Activo</label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCrear}
              disabled={creando || !nuevoNombre.trim()}
              className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              {creando ? 'Creando…' : 'Crear'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setNuevoNombre('');
                setNuevoTipo('');
                setNuevoDescuento('');
                setNuevoActivo(true);
              }}
              disabled={creando}
              className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de recursos */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="text-sm text-gray-600">Cargando recursos...</div>
        ) : recursos.length === 0 ? (
          <div className="text-sm text-gray-600">No hay recursos todavía.</div>
        ) : (
          recursos.map((r) => (
            <div key={r.id} className="p-4 border rounded space-y-2">
              {editandoId === r.id ? (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      disabled={guardando}
                      className="w-full px-3 py-2 border rounded disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Tipo</label>
                    <input
                      type="text"
                      value={editTipo}
                      onChange={(e) => setEditTipo(e.target.value)}
                      disabled={guardando}
                      className="w-full px-3 py-2 border rounded disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Descuento (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editDescuento}
                      onChange={(e) => setEditDescuento(e.target.value)}
                      disabled={guardando}
                      className="w-full px-3 py-2 border rounded disabled:opacity-50"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editActivo}
                      onChange={(e) => setEditActivo(e.target.checked)}
                      disabled={guardando}
                      className="disabled:opacity-50"
                    />
                    <label className="text-sm text-gray-600">Activo</label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleGuardar(r.id)}
                      disabled={guardando || !editNombre.trim()}
                      className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      {guardando ? 'Guardando…' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelarEdicion}
                      disabled={guardando}
                      className="px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{r.nombre}</div>
                      <div className="text-sm text-gray-600">Tipo: {r.tipo || '—'}</div>
                      <div className="text-sm text-gray-600">
                        Descuento: {r.descuentoPorcentaje !== null && r.descuentoPorcentaje !== undefined ? `${r.descuentoPorcentaje}%` : '—'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Activo: <strong>{r.activo ? 'Sí' : 'No'}</strong>
                      </div>
                      <div className="text-sm text-gray-600 font-mono mt-1 break-all">
                        QR: {r.codigoQr}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => handleIniciarEdicion(r)}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleActivo(r.id, r.activo)}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      {r.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEliminar(r.id)}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      Eliminar
                    </button>
                    {r.activo && (
                      <button
                        type="button"
                        onClick={() => router.push(`/validador/${r.id}`)}
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      >
                        Validador
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}








