'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Recurso = {
  id: number;
  nombre: string;
  tipo: string;
  descuentoPorcentaje?: number | null;
  precioCents?: number | null;
  activo: boolean;
  esExterno?: boolean;
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
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [nuevoActivo, setNuevoActivo] = useState(true);
  const [nuevoEsExterno, setNuevoEsExterno] = useState(false);
  const [creando, setCreando] = useState(false);

  // Edición
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTipo, setEditTipo] = useState('');
  const [editDescuento, setEditDescuento] = useState('');
  const [editPrecio, setEditPrecio] = useState('');
  const [editActivo, setEditActivo] = useState(false);
  const [editEsExterno, setEditEsExterno] = useState(false);
  const [guardando, setGuardando] = useState(false);

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

    if (nuevoPrecio && (isNaN(Number(nuevoPrecio)) || Number(nuevoPrecio) < 0)) {
      setError('El precio debe ser un número positivo');
      return;
    }

    setCreando(true);
    setError(null);

    try {
      const body: any = {
        nombre: nuevoNombre.trim(),
        tipo: nuevoTipo.trim() || null,
        activo: nuevoActivo,
        esExterno: nuevoEsExterno,
      };

      if (nuevoDescuento) {
        body.descuentoPorcentaje = Number(nuevoDescuento);
      }

      if (nuevoPrecio) {
        body.precioCents = Math.round(Number(nuevoPrecio) * 100);
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
      setNuevoPrecio('');
      setNuevoActivo(true);
      setNuevoEsExterno(false);
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
    setEditPrecio(r.precioCents ? (r.precioCents / 100).toString() : '');
    setEditActivo(r.activo);
    setEditEsExterno(r.esExterno === true);
  }

  function handleCancelarEdicion() {
    setEditandoId(null);
    setEditNombre('');
    setEditTipo('');
    setEditDescuento('');
    setEditPrecio('');
    setEditActivo(false);
    setEditEsExterno(false);
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

    if (editPrecio && (isNaN(Number(editPrecio)) || Number(editPrecio) < 0)) {
      setError('El precio debe ser un número positivo');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const body: any = {
        nombre: editNombre.trim(),
        tipo: editTipo.trim() || null,
        activo: editActivo,
        esExterno: editEsExterno,
      };

      if (editDescuento) {
        body.descuentoPorcentaje = Number(editDescuento);
      } else {
        body.descuentoPorcentaje = null;
      }

      if (editPrecio) {
        body.precioCents = Math.round(Number(editPrecio) * 100);
      } else {
        body.precioCents = null;
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
            <label className="block text-sm text-gray-600 mb-2">Gestión del recurso</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNuevoEsExterno(false)}
                disabled={creando}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  !nuevoEsExterno
                    ? 'bg-green-50 border-green-300 text-green-700 font-medium'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Municipal (pueblo)
              </button>
              <button
                type="button"
                onClick={() => setNuevoEsExterno(true)}
                disabled={creando}
                className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                  nuevoEsExterno
                    ? 'bg-orange-50 border-orange-300 text-orange-700 font-medium'
                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Externo (colaborador)
              </button>
            </div>
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
          <div>
            <label className="block text-sm text-gray-600 mb-1">Precio (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={nuevoPrecio}
              onChange={(e) => setNuevoPrecio(e.target.value)}
              disabled={creando}
              className="w-full px-3 py-2 border rounded disabled:opacity-50"
              placeholder="0.00"
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
                setNuevoPrecio('');
                setNuevoActivo(true);
                setNuevoEsExterno(false);
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
                    <label className="block text-sm text-gray-600 mb-2">Gestión del recurso</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditEsExterno(false)}
                        disabled={guardando}
                        className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                          !editEsExterno
                            ? 'bg-green-50 border-green-300 text-green-700 font-medium'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        Municipal (pueblo)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditEsExterno(true)}
                        disabled={guardando}
                        className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                          editEsExterno
                            ? 'bg-orange-50 border-orange-300 text-orange-700 font-medium'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        Externo (colaborador)
                      </button>
                    </div>
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
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Precio (€)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editPrecio}
                      onChange={(e) => setEditPrecio(e.target.value)}
                      disabled={guardando}
                      className="w-full px-3 py-2 border rounded disabled:opacity-50"
                      placeholder="0.00"
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{r.nombre}</span>
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                            r.esExterno
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : 'bg-green-50 text-green-700 border border-green-200'
                          }`}
                        >
                          {r.esExterno ? 'Externo' : 'Municipal'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">Tipo: {r.tipo || '—'}</div>
                      <div className="text-sm text-gray-600">
                        Precio: {r.precioCents ? `${(r.precioCents / 100).toFixed(2)} €` : '—'}
                      </div>
                      {r.descuentoPorcentaje && r.precioCents && (
                        <div className="text-sm text-green-600 font-medium">
                          Con descuento: {((r.precioCents / 100) * (1 - r.descuentoPorcentaje / 100)).toFixed(2)} €
                        </div>
                      )}
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
                  <div className="flex gap-2 mt-3 flex-wrap">
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
                      <a
                        href={`/validador/${r.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50 inline-block text-center"
                      >
                        Validador
                      </a>
                    )}
                    <a
                      href={`/gestion/asociacion/club/metricas/${puebloId}`}
                      className="px-3 py-1 text-sm border rounded hover:bg-blue-50 text-blue-600 border-blue-200 inline-block text-center"
                    >
                      Métricas
                    </a>
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
