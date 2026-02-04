'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Metricas = {
  usuarios?: { total: number };
  clientes?: { total: number };
  pedidos?: {
    total: number;
    pagados: number;
    ultimos30Dias: number;
  };
  productos?: {
    total: number;
    activos: number;
  };
};

export default function DatosMetricasPage() {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [clubMetricas, setClubMetricas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [resMetricas, resClub] = await Promise.all([
          fetch('/api/admin/datos/metricas', { cache: 'no-store' }),
          fetch('/api/club/admin/metricas-resumen?days=7', { cache: 'no-store' }),
        ]);
        if (resMetricas.ok) {
          setMetricas(await resMetricas.json());
        }
        if (resClub.ok) {
          setClubMetricas(await resClub.json());
        }
      } catch (e) {
        setError('Error cargando métricas');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="animate-pulse rounded-lg bg-gray-100 p-8">Cargando métricas...</div>
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
        <h1 className="text-3xl font-bold">Métricas</h1>
        <p className="mt-2 text-gray-600">
          Visión global de usuarios, clientes, pedidos y Club
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Usuarios totales"
          value={metricas?.usuarios?.total ?? '—'}
          subtitle="Registrados en la plataforma"
        />
        <MetricCard
          title="Clientes tienda"
          value={metricas?.clientes?.total ?? '—'}
          subtitle="Con al menos 1 pedido pagado"
        />
        <MetricCard
          title="Pedidos pagados"
          value={metricas?.pedidos?.pagados ?? '—'}
          subtitle={`${metricas?.pedidos?.ultimos30Dias ?? 0} últimos 30 días`}
        />
        <MetricCard
          title="Productos activos"
          value={metricas?.productos?.activos ?? '—'}
          subtitle={`${metricas?.productos?.total ?? 0} en catálogo`}
        />
      </div>

      {clubMetricas && (
        <div className="mt-10 rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Club LPBME (validaciones hoy)</h2>
          <div className="flex flex-wrap gap-4">
            <span className="rounded-md bg-gray-100 px-3 py-1 text-sm">
              Total hoy: {clubMetricas?.hoy?.total ?? 0}
            </span>
            <span className="rounded-md bg-green-100 px-3 py-1 text-sm text-green-800">
              OK: {clubMetricas?.hoy?.ok ?? 0}
            </span>
            <span className="rounded-md bg-amber-100 px-3 py-1 text-sm text-amber-800">
              Adultos: {clubMetricas?.hoy?.adultos ?? 0}
            </span>
            <span className="rounded-md bg-blue-100 px-3 py-1 text-sm text-blue-800">
              Menores: {clubMetricas?.hoy?.menores ?? 0}
            </span>
          </div>
          <Link
            href="/gestion/asociacion/club/metricas"
            className="mt-4 inline-block text-sm text-blue-600 hover:underline"
          >
            Ver detalle Club →
          </Link>
        </div>
      )}
    </main>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}
