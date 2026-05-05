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
  clubStatus?: string | null;
  clubPlan?: string | null;
  clubValidUntil?: string | null;
  numeroSocio?: number | null;
  provincia?: string | null;
  aceptaMarketing?: boolean;
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

const LIMIT_OPTIONS = [50, 100, 200, 500];

export default function DatosUsuariosPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [rol, setRol] = useState<string>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [activo, setActivo] = useState<string>('true');
  const [clubStatus, setClubStatus] = useState<string>('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(100);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQ, rol, limit, order, activo, clubStatus]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.set('limit', String(limit));
        params.set('offset', String(page * limit));
        params.set('order', order);
        if (activo) params.set('activo', activo);
        if (debouncedQ) params.set('q', debouncedQ);
        if (rol) params.set('rol', rol);
        if (clubStatus) params.set('clubStatus', clubStatus);
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
  }, [debouncedQ, rol, page, limit, order, activo, clubStatus]);

  async function handleEliminar(u: Usuario) {
    if (u.rol === 'ADMIN') return;
    if (!confirm(`¿Eliminar usuario ${u.email}? Se marcará como inactivo.`)) return;
    setDeletingId(u.id);
    try {
      const res = await fetch(`/api/admin/datos/usuarios/${u.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.filter((x) => x.id !== u.id),
                total: Math.max(0, prev.total - 1),
              }
            : null
        );
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err?.message ?? 'Error al eliminar');
      }
    } catch {
      setError('Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const from = total > 0 ? page * limit + 1 : 0;
  const to = Math.min((page + 1) * limit, total);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion/datos"
          className="mb-4 inline-block text-sm text-muted-foreground hover:text-gray-900"
        >
          ← Volver a Datos
        </Link>
        <h1 className="text-3xl font-bold">Usuarios</h1>
        <p className="mt-2 text-muted-foreground">
          Gestión completa: ver, editar, cambiar roles y pueblos visitados
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50/60 p-4 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-amber-900">
              Contactos institucionales vs usuarios
            </div>
            <p className="mt-1 text-amber-900">
              Esta pantalla lista <strong>usuarios</strong> de la web (con login y rol).
              Los <strong>contactos institucionales</strong> (alcaldes, concejales, técnicos de turismo…
              importados por vCard) son solo destinatarios de email; no tienen acceso ni aparecen aquí.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href="/gestion/asociacion/datos/usuarios-por-pueblo"
              className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
            >
              Ver usuarios + institucionales por pueblo
            </Link>
            <Link
              href="/gestion/asociacion/notas-prensa-newsletter/ayuntamientos/contactos"
              className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
            >
              Gestionar contactos institucionales
            </Link>
            <Link
              href="/gestion/asociacion/datos/auditoria-visitas"
              className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
              title="Ver quién creó cada visita (app, usuario, admin o script)"
            >
              Auditoría de visitas
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <input
          type="search"
          placeholder="Buscar por email, nombre..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="rounded-lg border border-border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Todos los roles</option>
          {Object.entries(ROL_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={activo}
          onChange={(e) => setActivo(e.target.value)}
          className="rounded-lg border border-border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
        <select
          value={clubStatus}
          onChange={(e) => setClubStatus(e.target.value)}
          className="rounded-lg border border-border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Filtrar por estado en el Club"
        >
          <option value="">Cualquier estado de Club</option>
          <option value="ACTIVE">Solo socios del Club</option>
          <option value="NONE">Solo NO socios</option>
        </select>
        <select
          value={order}
          onChange={(e) => setOrder(e.target.value as 'asc' | 'desc')}
          className="rounded-lg border border-border px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="desc">Últimos primero</option>
          <option value="asc">Primeros primero</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Mostrar
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-lg border border-border px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          por página
        </label>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="animate-pulse rounded-lg bg-muted p-8">Cargando usuarios...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Usuario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Rol
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Visitas
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Club
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Pedidos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      No hay usuarios
                    </td>
                  </tr>
                ) : (
                  items.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {[u.nombre, u.apellidos].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-gray-700">
                          {ROL_LABELS[u.rol] ?? u.rol}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">{u.totalVisitas}</td>
                      <td className="px-4 py-3 text-center text-sm">
                        {u.clubStatus === 'ACTIVE' ? (
                          <div className="flex flex-col items-center">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                u.clubPlan === 'LANZAMIENTO'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {u.clubPlan === 'LANZAMIENTO' ? 'Lanzamiento' : (u.clubPlan ?? 'Socio')}
                            </span>
                            {u.numeroSocio != null && (
                              <span className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                                Nº {String(u.numeroSocio).padStart(5, '0')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
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
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/gestion/asociacion/datos/usuarios/${u.id}`}
                            className="text-sm font-medium text-blue-600 hover:underline"
                          >
                            Ver / Editar
                          </Link>
                          {u.rol !== 'ADMIN' && (
                            <button
                              type="button"
                              onClick={() => handleEliminar(u)}
                              disabled={deletingId === u.id}
                              className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                            >
                              {deletingId === u.id ? 'Eliminando…' : 'Eliminar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <span>
              Mostrando {from}–{to} de {total} usuarios
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded border border-border px-3 py-1.5 font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-gray-700">
                Página {page + 1} de {totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || totalPages === 0}
                className="rounded border border-border px-3 py-1.5 font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
