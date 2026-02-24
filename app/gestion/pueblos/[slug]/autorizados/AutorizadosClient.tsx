'use client';

import { useEffect, useState } from 'react';

type ColaboradorPermiso = 'SOLO_METRICAS' | 'EDITAR_INFO' | 'EDITAR_TODO';

interface Autorizado {
  userId: number;
  email: string;
  nombre: string | null;
  rol: string;
  tipoAsignacion: 'PUEBLO' | 'RECURSO';
  recursoNombre: string | null;
  recursoId: number | null;
  activo: boolean;
  userActivo: boolean;
  asignadoEn: string;
  permisos?: ColaboradorPermiso | null;
}

interface RecursoOption {
  id: number;
  nombre: string;
  activo: boolean;
}

interface AutorizadosData {
  pueblo: string;
  puebloId: number;
  autorizados: Autorizado[];
  recursos: RecursoOption[];
}

const PERMISOS_LABELS: Record<ColaboradorPermiso, { label: string; desc: string; color: string }> = {
  SOLO_METRICAS: {
    label: 'Solo métricas',
    desc: 'Puede ver estadísticas de validaciones de su recurso, sin editar nada.',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  EDITAR_INFO: {
    label: 'Editar información',
    desc: 'Puede ver métricas y editar nombre, descripción, horarios, foto, contacto y web.',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  EDITAR_TODO: {
    label: 'Editar todo',
    desc: 'Acceso completo: métricas, información y precios/descuentos del Club.',
    color: 'bg-green-100 text-green-700 border-green-300',
  },
};

export default function AutorizadosClient({
  puebloSlug,
  puebloId,
  puebloNombre,
}: {
  puebloSlug: string;
  puebloId: number;
  puebloNombre: string;
}) {
  const [data, setData] = useState<AutorizadosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulario para añadir
  const [showForm, setShowForm] = useState(false);
  const [formEmail, setFormEmail] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formRol, setFormRol] = useState<'ALCALDE' | 'COLABORADOR'>('ALCALDE');
  const [formRecursoId, setFormRecursoId] = useState<number | ''>('');
  const [formPermisos, setFormPermisos] = useState<ColaboradorPermiso>('EDITAR_TODO');
  const [submitting, setSubmitting] = useState(false);

  // Edición de permisos inline
  const [editandoPermisos, setEditandoPermisos] = useState<{
    userId: number;
    recursoId: number;
    permisos: ColaboradorPermiso;
  } | null>(null);
  const [guardandoPermisos, setGuardandoPermisos] = useState(false);

  const fetchAutorizados = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pueblos/${puebloId}/autorizados`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Error al cargar autorizados');
      }
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutorizados();
  }, [puebloId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload: Record<string, any> = {
        email: formEmail.trim(),
        nombre: formNombre.trim() || undefined,
        rol: formRol,
      };
      if (formRol === 'COLABORADOR' && formRecursoId) {
        payload.recursoId = Number(formRecursoId);
        payload.permisos = formPermisos;
      }

      const res = await fetch(`/api/admin/pueblos/${puebloId}/autorizados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Error al añadir autorizado');
      }

      setFormEmail('');
      setFormNombre('');
      setFormRol('ALCALDE');
      setFormRecursoId('');
      setFormPermisos('EDITAR_TODO');
      setShowForm(false);
      await fetchAutorizados();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (a: Autorizado) => {
    const label =
      a.tipoAsignacion === 'RECURSO'
        ? `¿Quitar a ${a.email} del recurso "${a.recursoNombre}"?`
        : `¿Eliminar a ${a.email} de los autorizados de ${puebloNombre}?`;
    if (!confirm(label)) return;

    setError(null);
    try {
      const qs = a.recursoId ? `?recursoId=${a.recursoId}` : '';
      const res = await fetch(
        `/api/admin/pueblos/${puebloId}/autorizados/${a.userId}${qs}`,
        { method: 'DELETE' },
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error al eliminar autorizado');

      await fetchAutorizados();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleGuardarPermisos = async () => {
    if (!editandoPermisos) return;
    setGuardandoPermisos(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/pueblos/${puebloId}/autorizados/${editandoPermisos.userId}/permisos`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recursoId: editandoPermisos.recursoId,
            permisos: editandoPermisos.permisos,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Error actualizando permisos');
      setEditandoPermisos(null);
      await fetchAutorizados();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGuardandoPermisos(false);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Cargando autorizados...</p>;
  }

  const autorizadosActivos = data?.autorizados.filter((a) => a.activo) ?? [];

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Lista de autorizados */}
      <div className="rounded-md border">
        <div className="border-b bg-gray-50 px-4 py-3">
          <h3 className="font-medium">
            Usuarios autorizados ({autorizadosActivos.length})
          </h3>
        </div>

        {autorizadosActivos.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">
            No hay usuarios autorizados para este pueblo.
          </div>
        ) : (
          <div className="divide-y">
            {autorizadosActivos.map((a, idx) => {
              const permInfo = a.permisos ? PERMISOS_LABELS[a.permisos] : null;
              const isEditingThis =
                editandoPermisos?.userId === a.userId &&
                editandoPermisos?.recursoId === a.recursoId;

              return (
                <div
                  key={`${a.userId}-${a.recursoId ?? 'p'}-${idx}`}
                  className={`px-4 py-3 ${!a.userActivo ? 'opacity-60 bg-gray-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{a.email}</span>
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            a.rol === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : a.rol === 'COLABORADOR'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {a.rol}
                        </span>
                        {a.tipoAsignacion === 'RECURSO' && a.recursoNombre && (
                          <span className="text-xs text-gray-500">
                            → {a.recursoNombre}
                          </span>
                        )}
                      </div>
                      {a.nombre && (
                        <p className="text-xs text-gray-500 mt-0.5">{a.nombre}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        Asignado {new Date(a.asignadoEn).toLocaleDateString('es-ES')}
                      </p>

                      {/* Permisos actuales (solo colaboradores de recurso) */}
                      {a.tipoAsignacion === 'RECURSO' && permInfo && !isEditingThis && (
                        <div className={`mt-1.5 inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs ${permInfo.color}`}>
                          <span className="font-medium">{permInfo.label}</span>
                        </div>
                      )}

                      {/* Editor de permisos inline */}
                      {a.tipoAsignacion === 'RECURSO' && isEditingThis && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs font-medium text-gray-700">Nivel de acceso:</p>
                          <div className="flex flex-wrap gap-2">
                            {(Object.keys(PERMISOS_LABELS) as ColaboradorPermiso[]).map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() =>
                                  setEditandoPermisos((prev) =>
                                    prev ? { ...prev, permisos: p } : prev,
                                  )
                                }
                                className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                                  editandoPermisos.permisos === p
                                    ? PERMISOS_LABELS[p].color
                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {PERMISOS_LABELS[p].label}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">
                            {PERMISOS_LABELS[editandoPermisos.permisos].desc}
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleGuardarPermisos}
                              disabled={guardandoPermisos}
                              className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {guardandoPermisos ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditandoPermisos(null)}
                              disabled={guardandoPermisos}
                              className="rounded border px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {a.tipoAsignacion === 'RECURSO' && a.recursoId && !isEditingThis && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditandoPermisos({
                              userId: a.userId,
                              recursoId: a.recursoId!,
                              permisos: a.permisos ?? 'EDITAR_TODO',
                            })
                          }
                          className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100"
                        >
                          Permisos
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(a)}
                        className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Botón para mostrar formulario */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Añadir autorizado
        </button>
      )}

      {/* Formulario para añadir */}
      {showForm && (
        <form onSubmit={handleAdd} className="rounded-md border p-4 space-y-4">
          <h4 className="font-medium">Añadir usuario autorizado</h4>

          {/* Selector de rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol *
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormRol('ALCALDE');
                  setFormRecursoId('');
                }}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  formRol === 'ALCALDE'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Alcalde
              </button>
              <button
                type="button"
                onClick={() => setFormRol('COLABORADOR')}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  formRol === 'COLABORADOR'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Colaborador
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {formRol === 'ALCALDE'
                ? 'Tendrá acceso completo al pueblo: fotos, semáforos, contenidos, club, etc.'
                : 'Accederá a su recurso turístico con el nivel de permisos que establezcas.'}
            </p>
          </div>

          {/* Selector de recurso (solo COLABORADOR) */}
          {formRol === 'COLABORADOR' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recurso turístico *
                </label>
                {(data?.recursos?.length ?? 0) === 0 ? (
                  <p className="text-sm text-amber-600">
                    No hay recursos turísticos en este pueblo. Crea uno primero en el Club de Amigos.
                  </p>
                ) : (
                  <select
                    value={formRecursoId}
                    onChange={(e) =>
                      setFormRecursoId(e.target.value ? Number(e.target.value) : '')
                    }
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Selecciona un recurso...</option>
                    {data?.recursos?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre} {!r.activo ? '(inactivo)' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selector de permisos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel de acceso *
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(PERMISOS_LABELS) as ColaboradorPermiso[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormPermisos(p)}
                      className={`rounded border px-3 py-2 text-sm font-medium transition-colors ${
                        formPermisos === p
                          ? PERMISOS_LABELS[p].color
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {PERMISOS_LABELS[p].label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-gray-500">
                  {PERMISOS_LABELS[formPermisos].desc}
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder={
                formRol === 'COLABORADOR'
                  ? 'empresa@ejemplo.com'
                  : 'alcalde@pueblo.es'
              }
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              {formRol === 'COLABORADOR'
                ? 'Si el usuario no existe, se crea automáticamente y se le envía un email con sus credenciales.'
                : 'Si el usuario ya existe, se le asignará directamente.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre (opcional)
            </label>
            <input
              type="text"
              value={formNombre}
              onChange={(e) => setFormNombre(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Juan Pérez"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={
                submitting ||
                !formEmail.trim() ||
                (formRol === 'COLABORADOR' && !formRecursoId)
              }
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setFormEmail('');
                setFormNombre('');
                setFormRol('ALCALDE');
                setFormRecursoId('');
                setFormPermisos('EDITAR_TODO');
              }}
              className="rounded-md border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
