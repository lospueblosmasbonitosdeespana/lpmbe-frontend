'use client';

import { useState, useEffect, useCallback } from 'react';

type ColaboradorPermiso = 'SOLO_METRICAS' | 'EDITAR_INFO' | 'EDITAR_TODO';

const PERMISOS_LABELS: Record<ColaboradorPermiso, string> = {
  SOLO_METRICAS: 'Solo métricas',
  EDITAR_INFO: 'Editar información',
  EDITAR_TODO: 'Editar todo',
};

type Recurso = {
  id: number;
  nombre: string;
  tipo: string;
  descripcion?: string | null;
  horarios?: string | null;
  contacto?: string | null;
  web?: string | null;
  fotoUrl?: string | null;
  descuentoPorcentaje?: number | null;
  precioCents?: number | null;
  activo: boolean;
  cerradoTemporal: boolean;
  maxAdultos: number;
  maxMenores: number;
  edadMaxMenor: number;
  pueblo?: { id: number; nombre: string; slug: string } | null;
  permisos?: ColaboradorPermiso;
};

type Metricas = {
  totalValidaciones: number;
  totalOk: number;
  totalNoOk: number;
  totalAdultos: number;
  periodos?: { hoy: number; semana: number; mes: number };
};

export default function ColaboradorPuebloClient({ puebloSlug }: { puebloSlug: string }) {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tab, setTab] = useState<'info' | 'metricas'>('metricas');

  // Métricas
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loadingMetricas, setLoadingMetricas] = useState(false);

  // Edición
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editHorarios, setEditHorarios] = useState('');
  const [editContacto, setEditContacto] = useState('');
  const [editWeb, setEditWeb] = useState('');
  const [editDescuento, setEditDescuento] = useState('');
  const [editPrecio, setEditPrecio] = useState('');
  const [editMaxAdultos, setEditMaxAdultos] = useState('1');
  const [editMaxMenores, setEditMaxMenores] = useState('0');
  const [editEdadMaxMenor, setEditEdadMaxMenor] = useState('12');
  const [guardando, setGuardando] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);

  const loadRecursos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/colaborador/recursos', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error cargando recursos');
      const data = await res.json();
      const lista: Recurso[] = Array.isArray(data) ? data : data.items ?? [];
      // Filtrar solo los del pueblo actual
      const dePueblo = lista.filter(
        (r) => r.pueblo?.slug === puebloSlug,
      );
      setRecursos(dePueblo);
      if (dePueblo.length > 0 && !selectedId) {
        setSelectedId(dePueblo[0].id);
      }
    } catch (e: any) {
      setError(e.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [puebloSlug, selectedId]);

  useEffect(() => {
    loadRecursos();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const recurso = recursos.find((r) => r.id === selectedId);
    if (!recurso) return;

    setEditNombre(recurso.nombre ?? '');
    setEditDescripcion(recurso.descripcion ?? '');
    setEditHorarios(recurso.horarios ?? '');
    setEditContacto(recurso.contacto ?? '');
    setEditWeb(recurso.web ?? '');
    setEditDescuento(recurso.descuentoPorcentaje?.toString() ?? '');
    setEditPrecio(recurso.precioCents ? (recurso.precioCents / 100).toString() : '');
    setEditMaxAdultos(String(recurso.maxAdultos ?? 1));
    setEditMaxMenores(String(recurso.maxMenores ?? 0));
    setEditEdadMaxMenor(String(recurso.edadMaxMenor ?? 12));
    setGuardadoOk(false);
  }, [selectedId, recursos]);

  useEffect(() => {
    if (!selectedId || tab !== 'metricas') return;
    setLoadingMetricas(true);
    fetch(`/api/colaborador/recursos/${selectedId}/metricas`, { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setMetricas(data))
      .catch(() => setMetricas(null))
      .finally(() => setLoadingMetricas(false));
  }, [selectedId, tab]);

  const handleGuardar = async () => {
    if (!selectedId) return;
    const recurso = recursos.find((r) => r.id === selectedId);
    if (!recurso) return;

    setGuardando(true);
    setGuardadoOk(false);
    setError(null);

    const canEditPrices = recurso.permisos === 'EDITAR_TODO';

    const body: Record<string, any> = {
      descripcion: editDescripcion.trim() || null,
      horarios: editHorarios.trim() || null,
      contacto: editContacto.trim() || null,
      web: editWeb.trim() || null,
    };

    if (recurso.permisos === 'EDITAR_TODO') {
      body.nombre = editNombre.trim();
    }

    if (canEditPrices) {
      body.descuentoPorcentaje = editDescuento ? Number(editDescuento) : null;
      body.precioCents = editPrecio ? Math.round(Number(editPrecio) * 100) : null;
      body.maxAdultos = Math.max(1, Number(editMaxAdultos) || 1);
      body.maxMenores = Math.max(0, Number(editMaxMenores) || 0);
      body.edadMaxMenor = Math.max(0, Number(editEdadMaxMenor) || 12);
    }

    try {
      const res = await fetch(`/api/colaborador/recursos/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error guardando');
      }
      setGuardadoOk(true);
      await loadRecursos();
    } catch (e: any) {
      setError(e.message ?? 'Error desconocido');
    } finally {
      setGuardando(false);
    }
  };

  const recursoActual = recursos.find((r) => r.id === selectedId);
  const permisos: ColaboradorPermiso = recursoActual?.permisos ?? 'EDITAR_TODO';
  const puedeEditar = permisos === 'EDITAR_INFO' || permisos === 'EDITAR_TODO';
  const puedeEditarPrecios = permisos === 'EDITAR_TODO';
  const puedeEditarNombre = permisos === 'EDITAR_TODO';

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500">Cargando recursos...</div>
    );
  }

  if (recursos.length === 0) {
    return (
      <div className="p-6">
        <p className="text-gray-600 text-sm">
          No tienes recursos turísticos asignados en este pueblo.
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Contacta con el alcalde del pueblo para que te asigne un recurso.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[600px]">
      {/* Sidebar de recursos */}
      <aside className="w-56 flex-shrink-0 border-r bg-gray-50">
        <div className="p-3 border-b">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Mis recursos
          </p>
        </div>
        <nav className="p-2 space-y-1">
          {recursos.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                setSelectedId(r.id);
                setTab('metricas');
              }}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                selectedId === r.id
                  ? 'bg-white border shadow-sm font-medium text-gray-900'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
            >
              <span className="block truncate">{r.nombre}</span>
              {r.permisos && (
                <span className="text-xs text-gray-400">
                  {PERMISOS_LABELS[r.permisos]}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 overflow-auto">
        {!recursoActual ? (
          <div className="p-6 text-gray-500 text-sm">Selecciona un recurso</div>
        ) : (
          <div>
            {/* Cabecera */}
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold">{recursoActual.nombre}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Tipo: {recursoActual.tipo || '—'}
                {recursoActual.activo ? (
                  <span className="ml-2 text-green-600">● Activo</span>
                ) : (
                  <span className="ml-2 text-red-500">● Inactivo</span>
                )}
                {recursoActual.cerradoTemporal && (
                  <span className="ml-2 text-amber-500">⚠ Cerrado temporalmente</span>
                )}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b px-6">
              <button
                onClick={() => setTab('metricas')}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  tab === 'metricas'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Métricas
              </button>
              {puedeEditar && (
                <button
                  onClick={() => setTab('info')}
                  className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tab === 'info'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Información
                </button>
              )}
            </div>

            {/* TAB: Métricas */}
            {tab === 'metricas' && (
              <div className="p-6">
                {loadingMetricas ? (
                  <p className="text-sm text-gray-500">Cargando métricas...</p>
                ) : !metricas ? (
                  <p className="text-sm text-gray-400">No hay datos de métricas disponibles.</p>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="rounded-lg border bg-white p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600">{metricas.totalValidaciones}</p>
                        <p className="text-xs text-gray-500 mt-1">Total validaciones</p>
                      </div>
                      <div className="rounded-lg border bg-white p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{metricas.totalOk}</p>
                        <p className="text-xs text-gray-500 mt-1">Válidas</p>
                      </div>
                      <div className="rounded-lg border bg-white p-4 text-center">
                        <p className="text-2xl font-bold text-red-500">{metricas.totalNoOk}</p>
                        <p className="text-xs text-gray-500 mt-1">Rechazadas</p>
                      </div>
                      <div className="rounded-lg border bg-white p-4 text-center">
                        <p className="text-2xl font-bold text-gray-700">{metricas.totalAdultos}</p>
                        <p className="text-xs text-gray-500 mt-1">Adultos</p>
                      </div>
                    </div>

                    {metricas.periodos && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Por período</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="rounded-lg border bg-blue-50 p-4 text-center">
                            <p className="text-xl font-bold text-blue-700">{metricas.periodos.hoy}</p>
                            <p className="text-xs text-blue-600 mt-1">Hoy</p>
                          </div>
                          <div className="rounded-lg border bg-blue-50 p-4 text-center">
                            <p className="text-xl font-bold text-blue-700">{metricas.periodos.semana}</p>
                            <p className="text-xs text-blue-600 mt-1">Esta semana</p>
                          </div>
                          <div className="rounded-lg border bg-blue-50 p-4 text-center">
                            <p className="text-xl font-bold text-blue-700">{metricas.periodos.mes}</p>
                            <p className="text-xs text-blue-600 mt-1">Este mes</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Información */}
            {tab === 'info' && puedeEditar && (
              <div className="p-6 space-y-5 max-w-2xl">
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                {guardadoOk && (
                  <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                    Cambios guardados correctamente.
                  </div>
                )}

                {puedeEditarNombre && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del recurso
                    </label>
                    <input
                      type="text"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      disabled={guardando}
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Se traducirá automáticamente a 6 idiomas.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={editDescripcion}
                    onChange={(e) => setEditDescripcion(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={4}
                    disabled={guardando}
                    placeholder="Describe el recurso para los visitantes..."
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Se traducirá automáticamente a 6 idiomas.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horarios
                  </label>
                  <textarea
                    value={editHorarios}
                    onChange={(e) => setEditHorarios(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={3}
                    disabled={guardando}
                    placeholder="Lunes–Viernes 9:00–18:00..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contacto
                  </label>
                  <input
                    type="text"
                    value={editContacto}
                    onChange={(e) => setEditContacto(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    disabled={guardando}
                    placeholder="+34 600 000 000 / info@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Web
                  </label>
                  <input
                    type="url"
                    value={editWeb}
                    onChange={(e) => setEditWeb(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    disabled={guardando}
                    placeholder="https://www.ejemplo.com"
                  />
                </div>

                {puedeEditarPrecios && (
                  <>
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Precios y condiciones del Club
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Precio regular (€)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editPrecio}
                          onChange={(e) => setEditPrecio(e.target.value)}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                          disabled={guardando}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descuento Club (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editDescuento}
                          onChange={(e) => setEditDescuento(e.target.value)}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                          disabled={guardando}
                        />
                      </div>
                    </div>

                    <div className="rounded-md bg-blue-50 border border-blue-100 p-3 space-y-3">
                      <p className="text-xs font-medium text-blue-700">Condiciones del descuento</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-blue-600 mb-1">Máx. adultos</label>
                          <input
                            type="number"
                            min="1"
                            value={editMaxAdultos}
                            onChange={(e) => setEditMaxAdultos(e.target.value)}
                            className="w-full rounded border px-2 py-1.5 text-sm"
                            disabled={guardando}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-blue-600 mb-1">Máx. menores</label>
                          <input
                            type="number"
                            min="0"
                            value={editMaxMenores}
                            onChange={(e) => setEditMaxMenores(e.target.value)}
                            className="w-full rounded border px-2 py-1.5 text-sm"
                            disabled={guardando}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-blue-600 mb-1">Edad máx. menor</label>
                          <input
                            type="number"
                            min="0"
                            value={editEdadMaxMenor}
                            onChange={(e) => setEditEdadMaxMenor(e.target.value)}
                            className="w-full rounded border px-2 py-1.5 text-sm"
                            disabled={guardando}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <button
                    type="button"
                    onClick={handleGuardar}
                    disabled={guardando}
                    className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
