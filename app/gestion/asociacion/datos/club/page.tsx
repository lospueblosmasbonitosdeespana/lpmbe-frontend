'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ClubCliente = {
  id: number;
  userId: number;
  email: string;
  nombre: string | null;
  apellidos: string | null;
  tipo: string;
  estado: string;
  startsAt: string;
  expiresAt: string;
  importeCents: number | null;
  diasRestantes: number | null;
  totalVisitas: number;
  totalValidaciones: number;
  clubStatus: string | null;
  clubPlan: string | null;
};

type ListResponse = {
  items: ClubCliente[];
  total: number;
};

const TIPO_LABELS: Record<string, string> = {
  ANUAL: 'Anual',
  MENSUAL: 'Mensual',
};

const ESTADO_LABELS: Record<string, string> = {
  ACTIVA: 'Activa',
  CADUCADA: 'Caducada',
  CANCELADA: 'Cancelada',
};

const LIMIT_OPTIONS = [50, 100, 200];

export default function DatosClubPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<string>('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQ, estado, limit]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams();
        params.set('limit', String(limit));
        params.set('offset', String(page * limit));
        if (debouncedQ) params.set('q', debouncedQ);
        if (estado) params.set('estado', estado);
        const res = await fetch(`/api/admin/datos/club?${params.toString()}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          const err = await res.json().catch(() => ({}));
          setError(err?.message ?? 'Error cargando datos');
        }
      } catch (e) {
        setError('Error cargando datos');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [debouncedQ, estado, page, limit]);

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
          className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-900"
        >
          ← Volver a Datos
        </Link>
        <h1 className="text-3xl font-bold">Club de Amigos</h1>
        <p className="mt-2 text-gray-600">
          Suscriptores del club: quién ha pagado, duración, pueblos visitados y validaciones
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <input
          type="search"
          placeholder="Buscar por email, nombre..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Mostrar
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        <div className="animate-pulse rounded-lg bg-gray-100 p-8">Cargando...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Socio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Importe
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Válida hasta
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Días rest.
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Pueblos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Validaciones
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                      No hay suscriptores del club
                    </td>
                  </tr>
                ) : (
                  items.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium text-gray-900">
                            {[c.nombre, c.apellidos].filter(Boolean).join(' ') || '—'}
                          </span>
                          <div className="text-sm text-gray-500">{c.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {TIPO_LABELS[c.tipo] ?? c.tipo}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {c.importeCents != null
                          ? `${(c.importeCents / 100).toFixed(2)} €`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.estado === 'ACTIVA'
                              ? 'bg-green-100 text-green-800'
                              : c.estado === 'CADUCADA'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {ESTADO_LABELS[c.estado] ?? c.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(c.expiresAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {c.diasRestantes != null ? (
                          <span
                            className={
                              c.diasRestantes <= 30
                                ? 'font-medium text-amber-600'
                                : 'text-gray-600'
                            }
                          >
                            {c.diasRestantes} días
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {c.totalVisitas}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {c.totalValidaciones}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/gestion/asociacion/datos/usuarios/${c.userId}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          Ver usuario
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <span>
              Mostrando {from}–{to} de {total} socios
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-gray-700">
                Página {page + 1} de {totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || totalPages === 0}
                className="rounded border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      <Link
        href="/gestion/asociacion/club/metricas"
        className="mt-6 inline-block text-sm text-blue-600 hover:underline"
      >
        Ver métricas de validaciones del Club →
      </Link>
    </main>
  );
}
