'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type PuebloVisitado = {
  puebloId: number;
  pueblo: {
    id: number;
    nombre: string;
    slug: string;
    provincia: string;
    comunidad: string;
    foto_destacada: string | null;
  };
  origen: 'GPS' | 'MANUAL';
  ultima_fecha: string;
  rating?: number | null;
};

type UsuarioDetalle = {
  id: number;
  email: string;
  nombre: string | null;
  apellidos: string | null;
  telefono: string | null;
  rol: string;
  activo: boolean;
  emailVerificado: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  avatarUrl: string | null;
  clubStatus: string | null;
  clubPlan: string | null;
  clubValidUntil: string | null;
  esCliente: boolean;
  clienteDesde: string | null;
  ultimoPedidoAt: string | null;
  totalVisitas: number;
  totalPedidos: number;
  pueblosVisitados: {
    total: number;
    gps: number;
    manual: number;
    items: PuebloVisitado[];
  };
};

type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  provincia?: string;
  comunidad?: string;
  lat?: number;
  lng?: number;
};

const ROL_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  ALCALDE: 'Alcalde',
  USUARIO: 'Usuario',
  CLIENTE: 'Cliente',
};

export default function UsuarioDetallePage() {
  const params = useParams();
  const id = params?.id as string;
  const [user, setUser] = useState<UsuarioDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    rol: '',
    activo: true,
  });
  const [addPuebloSearch, setAddPuebloSearch] = useState('');
  const [pueblosOptions, setPueblosOptions] = useState<Pueblo[]>([]);
  const [addingVisita, setAddingVisita] = useState(false);
  const [visitaError, setVisitaError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/datos/usuarios/${id}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setForm({
          nombre: data.nombre ?? '',
          apellidos: data.apellidos ?? '',
          email: data.email ?? '',
          telefono: data.telefono ?? '',
          rol: data.rol ?? 'USUARIO',
          activo: data.activo ?? true,
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err?.message ?? 'Usuario no encontrado');
      }
    } catch (e) {
      setError('Error cargando usuario');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (addPuebloSearch.length < 2) {
      setPueblosOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(
        `/api/pueblos?search=${encodeURIComponent(addPuebloSearch)}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        setPueblosOptions(Array.isArray(data) ? data.slice(0, 20) : []);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [addPuebloSearch]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/datos/usuarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre || null,
          apellidos: form.apellidos || null,
          email: form.email || undefined,
          telefono: form.telefono || null,
          rol: form.rol,
          activo: form.activo,
        }),
      });
      if (res.ok) {
        await loadUser();
        setEditMode(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err?.message ?? err?.error ?? 'Error al guardar');
      }
    } catch (e) {
      setError('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVisita = async (puebloId: number, origen: 'GPS' | 'MANUAL' = 'MANUAL') => {
    if (!id) return;
    setAddingVisita(true);
    setVisitaError(null);
    try {
      const res = await fetch(`/api/admin/datos/usuarios/${id}/visitas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puebloId, origen }),
      });
      if (res.ok) {
        await loadUser();
        setAddPuebloSearch('');
        setPueblosOptions([]);
      } else {
        const err = await res.json().catch(() => ({}));
        setVisitaError(err?.message ?? err?.error ?? 'Error al añadir visita');
      }
    } catch (e) {
      setVisitaError('Error al añadir visita');
    } finally {
      setAddingVisita(false);
    }
  };

  const visitedIds = new Set(user?.pueblosVisitados?.items?.map((i) => i.puebloId) ?? []);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="animate-pulse rounded-lg bg-gray-100 p-8">Cargando usuario...</div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/gestion/asociacion/datos/usuarios" className="text-sm text-blue-600 hover:underline">
          ← Volver a Usuarios
        </Link>
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion/datos/usuarios"
          className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-900"
        >
          ← Volver a Usuarios
        </Link>
        <h1 className="text-3xl font-bold">
          {user?.nombre || user?.apellidos
            ? [user.nombre, user.apellidos].filter(Boolean).join(' ')
            : user?.email ?? 'Usuario'}
        </h1>
        <p className="mt-1 text-gray-600">ID: {user?.id} · {user?.email}</p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {/* Tarjeta de datos personales */}
      <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Datos personales</h2>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>

        {editMode ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Apellidos</label>
              <input
                type="text"
                value={form.apellidos}
                onChange={(e) => setForm((f) => ({ ...f, apellidos: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Rol</label>
              <select
                value={form.rol}
                onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Object.entries(ROL_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Estado</label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Activo</span>
              </label>
            </div>
          </div>
        ) : (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Nombre</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {[user?.nombre, user?.apellidos].filter(Boolean).join(' ') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Email</dt>
              <dd className="mt-0.5 text-sm">{user?.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Teléfono</dt>
              <dd className="mt-0.5 text-sm">{user?.telefono ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Rol</dt>
              <dd className="mt-0.5">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {ROL_LABELS[user?.rol ?? ''] ?? user?.rol}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Estado</dt>
              <dd className="mt-0.5">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    user?.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user?.activo ? 'Activo' : 'Inactivo'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Registro</dt>
              <dd className="mt-0.5 text-sm">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleString('es-ES')
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-gray-500">Último acceso</dt>
              <dd className="mt-0.5 text-sm">
                {user?.lastLoginAt
                  ? new Date(user.lastLoginAt).toLocaleString('es-ES')
                  : '—'}
              </dd>
            </div>
          </dl>
        )}
      </section>

      {/* Pueblos visitados */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Pueblos visitados</h2>
        <p className="mb-4 text-sm text-gray-600">
          Total: {user?.pueblosVisitados?.total ?? 0} · GPS: {user?.pueblosVisitados?.gps ?? 0} · Manual: {user?.pueblosVisitados?.manual ?? 0}
        </p>

        {/* Añadir pueblo */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Añadir pueblo visitado (por nombre o búsqueda)
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Buscar pueblo..."
              value={addPuebloSearch}
              onChange={(e) => setAddPuebloSearch(e.target.value)}
              className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {visitaError && (
            <p className="mt-2 text-sm text-red-600">{visitaError}</p>
          )}
          {pueblosOptions.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
              {pueblosOptions.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border-b border-gray-100 px-4 py-2 last:border-0 hover:bg-gray-50"
                >
                  <span className="text-sm font-medium">
                    {p.nombre}
                    {p.provincia && (
                      <span className="ml-2 text-gray-500">
                        ({p.provincia}{p.comunidad ? `, ${p.comunidad}` : ''})
                      </span>
                    )}
                  </span>
                  {visitedIds.has(p.id) ? (
                    <span className="text-xs text-gray-400">Ya visitado</span>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAddVisita(p.id, 'MANUAL')}
                        disabled={addingVisita}
                        className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                      >
                        + Manual
                      </button>
                      <button
                        onClick={() => handleAddVisita(p.id, 'GPS')}
                        disabled={addingVisita}
                        className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                      >
                        + GPS
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lista de pueblos visitados */}
        <div className="rounded-lg border border-gray-200">
          {!user?.pueblosVisitados?.items?.length ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              No hay pueblos visitados. Usa la búsqueda para añadir uno.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {user.pueblosVisitados.items.map((item) => (
                <li
                  key={item.puebloId}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div>
                    <span className="font-medium">{item.pueblo.nombre}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      {item.pueblo.provincia}
                      {item.pueblo.comunidad ? ` · ${item.pueblo.comunidad}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.origen === 'GPS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.origen}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(item.ultima_fecha).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
