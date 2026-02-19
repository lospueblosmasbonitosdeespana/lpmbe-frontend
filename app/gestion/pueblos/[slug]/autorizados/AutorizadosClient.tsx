'use client';

import { useEffect, useState } from 'react';

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
  const [formPassword, setFormPassword] = useState('');
  const [formRol, setFormRol] = useState<'ALCALDE' | 'COLABORADOR'>('ALCALDE');
  const [formRecursoId, setFormRecursoId] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

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
        password: formPassword.trim() || undefined,
        rol: formRol,
      };
      if (formRol === 'COLABORADOR' && formRecursoId) {
        payload.recursoId = Number(formRecursoId);
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
      setFormPassword('');
      setFormRol('ALCALDE');
      setFormRecursoId('');
      setShowForm(false);
      await fetchAutorizados();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (a: Autorizado) => {
    const label = a.tipoAsignacion === 'RECURSO'
      ? `¿Quitar a ${a.email} del recurso "${a.recursoNombre}"?`
      : `¿Eliminar a ${a.email} de los autorizados de ${puebloNombre}?`;
    if (!confirm(label)) {
      return;
    }

    setError(null);
    try {
      const qs = a.recursoId ? `?recursoId=${a.recursoId}` : '';
      const res = await fetch(`/api/admin/pueblos/${puebloId}/autorizados/${a.userId}${qs}`, {
        method: 'DELETE',
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Error al eliminar autorizado');
      }

      await fetchAutorizados();
    } catch (e: any) {
      setError(e.message);
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
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Rol</th>
                <th className="px-4 py-2 font-medium">Recurso</th>
                <th className="px-4 py-2 font-medium">Asignado</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {autorizadosActivos.map((a, idx) => (
                <tr key={`${a.userId}-${a.recursoId ?? 'p'}-${idx}`} className={!a.userActivo ? 'bg-gray-100 opacity-60' : ''}>
                  <td className="px-4 py-2">{a.email}</td>
                  <td className="px-4 py-2">{a.nombre || '-'}</td>
                  <td className="px-4 py-2">
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
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {a.recursoNombre ?? '-'}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(a.asignadoEn).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleRemove(a)}
                      className="text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                onClick={() => { setFormRol('ALCALDE'); setFormRecursoId(''); }}
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
                : 'Solo podrá validar QRs y ver métricas del recurso turístico asignado.'}
            </p>
          </div>

          {/* Selector de recurso (solo COLABORADOR) */}
          {formRol === 'COLABORADOR' && (
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
                  onChange={(e) => setFormRecursoId(e.target.value ? Number(e.target.value) : '')}
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
              placeholder={formRol === 'COLABORADOR' ? 'empresa@ejemplo.com' : 'alcalde@pueblo.es'}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Si el usuario ya existe, se le asignará directamente.
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña (solo si es usuario nuevo)
            </label>
            <input
              type="password"
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500">
              Requerida si el email no está registrado. Mínimo 6 caracteres.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || !formEmail.trim() || (formRol === 'COLABORADOR' && !formRecursoId)}
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
                setFormPassword('');
                setFormRol('ALCALDE');
                setFormRecursoId('');
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
