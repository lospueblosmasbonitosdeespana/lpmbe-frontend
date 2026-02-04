'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Cliente = {
  id: number;
  email: string;
  nombre: string | null;
  apellidos: string | null;
  clienteDesde: string | null;
  ultimoPedidoAt: string | null;
  totalPedidos: number;
};

export default function DatosClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/admin/datos/clientes', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setClientes(Array.isArray(data) ? data : []);
        } else {
          const err = await res.json().catch(() => ({}));
          setError(err?.message ?? 'Error cargando clientes');
        }
      } catch (e) {
        setError('Error cargando clientes');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="animate-pulse rounded-lg bg-gray-100 p-8">Cargando clientes...</div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion/datos"
          className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-900"
        >
          ← Volver a Datos
        </Link>
        <h1 className="text-3xl font-bold">Clientes</h1>
        <p className="mt-2 text-gray-600">
          Usuarios que han realizado al menos un pedido pagado en la tienda
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Pedidos
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cliente desde
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Último pedido
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  No hay clientes aún
                </td>
              </tr>
            ) : (
              clientes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {[c.nombre, c.apellidos].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-center text-sm font-medium">
                    {c.totalPedidos}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {c.clienteDesde
                      ? new Date(c.clienteDesde).toLocaleDateString('es-ES')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {c.ultimoPedidoAt
                      ? new Date(c.ultimoPedidoAt).toLocaleDateString('es-ES')
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Total: {clientes.length} cliente{clientes.length !== 1 ? 's' : ''}
      </div>

      <Link
        href="/gestion/asociacion/tienda/pedidos"
        className="mt-6 inline-block text-sm text-blue-600 hover:underline"
      >
        Ver todos los pedidos →
      </Link>
    </main>
  );
}
