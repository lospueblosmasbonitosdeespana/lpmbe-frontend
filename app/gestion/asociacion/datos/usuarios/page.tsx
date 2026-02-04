'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Usuario = {
  id: number;
  email: string;
  nombre: string | null;
  apellidos: string | null;
  rol: string;
  activo: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  esCliente: boolean;
  totalVisitas: number;
  totalPedidos: number;
};

type ListResponse = {
  items: Usuario[];
  total: number;
};

const ROL_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  ALCALDE: 'Alcalde',
  USUARIO: 'Usuario',
  CLIENTE: 'Cliente',
};

export default function DatosUsuariosPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [rol, setRol] = useState<string>('');
  const [debouncedQ, setDebouncedQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.set('limit', '100');
        if (debouncedQ) params.set('q', debouncedQ);
        if (rol) params.set('rol', rol);
        const res = await fetch(`/api/admin/datos/usuarios?${params.toString()}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          const err = await res.json().catch(() => ({}));
          setError(err?.message ?? 'Error cargando usuarios');
        }
      } catch (e) {
        setError('Error cargando usuarios');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [debouncedQ, rol]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion/datos"
          className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-900"
        >
          ← Volver a Datos
        </Link>
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <p className="mt-2 text-gray-600">
          Gestión completa: ver, editar, cambiar roles y pueblos visitados
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="search"
          placeholder="Buscar por email, nombre..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Todos los roles</option>
          {Object.entries(ROL_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="animate-pulse rounded-lg bg-gray-100 p-8">Cargando usuarios...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Visitas
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Pedidos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      No hay usuarios
                    </td>
                  </tr>
                ) : (
                  items.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {[u.nombre, u.apellidos].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          {ROL_LABELS[u.rol] ?? u.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{u.totalVisitas}</td>
                      <td className="px-4 py-3 text-center text-sm">{u.totalPedidos}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/gestion/asociacion/datos/usuarios/${u.id}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          Ver / Editar
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600">
            Mostrando {items.length} de {total} usuarios
          </div>
        </div>
      )}
    </main>
  );
}
