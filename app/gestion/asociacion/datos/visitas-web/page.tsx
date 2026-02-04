'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type VisitasWebStats = {
  periodo: { dias: number; desde: string };
  resumen: {
    totalPageViews: number;
    totalEvents: number;
    uniqueSessions: number;
    promedioPorDia: number;
  };
  porDia: { fecha: string; total: number }[];
  porRuta: { path: string; total: number }[];
  porOrigen: { source: string; total: number }[];
  porDispositivo: { deviceType: string; total: number }[];
  porNavegador: { browser: string; total: number }[];
  referrers: { referrerHost: string; total: number }[];
  eventos?: { eventName: string; total: number }[];
};

export default function VisitasWebPage() {
  const [stats, setStats] = useState<VisitasWebStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/datos/visitas-web?days=${days}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          setStats(await res.json());
        } else {
          setError('Error cargando estadísticas');
        }
      } catch (e) {
        setError('Error cargando estadísticas');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [days]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="animate-pulse rounded-lg bg-gray-100 p-8">
          Cargando visitas y datos de la web...
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/gestion/asociacion/datos"
            className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-900"
          >
            ← Volver a Datos
          </Link>
          <h1 className="text-3xl font-bold">Visitas y datos de la web</h1>
          <p className="mt-2 text-gray-600">
            Analytics propio: páginas vistas, sesiones, dispositivos y referrers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Período:</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value={7}>7 días</option>
            <option value={14}>14 días</option>
            <option value={30}>30 días</option>
            <option value={60}>60 días</option>
            <option value={90}>90 días</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {stats && (
        <>
          {/* Resumen */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Páginas vistas"
              value={stats.resumen.totalPageViews}
              subtitle={`~${stats.resumen.promedioPorDia} por día`}
            />
            <StatCard
              title="Sesiones únicas"
              value={stats.resumen.uniqueSessions}
              subtitle="Por sessionId"
            />
            <StatCard
              title="Eventos"
              value={stats.resumen.totalEvents}
              subtitle="Clicks y acciones"
            />
            <StatCard
              title="Promedio/día"
              value={stats.resumen.promedioPorDia}
              subtitle={`Últimos ${days} días`}
            />
          </div>

          {/* Por día */}
          {stats.porDia.length > 0 && (
            <Section title="Visitas por día">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Fecha
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">
                        Páginas vistas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.porDia.slice(-14).map((d) => (
                      <tr key={d.fecha}>
                        <td className="px-4 py-2 text-sm">{d.fecha}</td>
                        <td className="px-4 py-2 text-right font-medium">{d.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Por ruta */}
          {stats.porRuta.length > 0 && (
            <Section title="Páginas más visitadas">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Ruta
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">
                        Visitas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.porRuta.slice(0, 20).map((r) => (
                      <tr key={r.path}>
                        <td className="px-4 py-2 font-mono text-sm">{r.path}</td>
                        <td className="px-4 py-2 text-right font-medium">{r.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Por origen y dispositivo */}
          <div className="grid gap-8 lg:grid-cols-2">
            {stats.porOrigen.length > 0 && (
              <Section title="Por origen (web/app)">
                <ul className="space-y-2">
                  {stats.porOrigen.map((o) => (
                    <li key={o.source} className="flex justify-between text-sm">
                      <span className="capitalize">{o.source}</span>
                      <span className="font-medium">{o.total}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {stats.porDispositivo.length > 0 && (
              <Section title="Por dispositivo">
                <ul className="space-y-2">
                  {stats.porDispositivo.map((d) => (
                    <li key={d.deviceType} className="flex justify-between text-sm">
                      <span className="capitalize">{d.deviceType}</span>
                      <span className="font-medium">{d.total}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>

          {/* Eventos */}
          {stats.eventos && stats.eventos.length > 0 && (
            <Section title="Eventos (clicks, conversiones)">
              <ul className="space-y-2">
                {stats.eventos.map((e) => (
                  <li key={e.eventName} className="flex justify-between text-sm">
                    <span>{e.eventName}</span>
                    <span className="font-medium">{e.total}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Navegadores y referrers */}
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {stats.porNavegador.length > 0 && (
              <Section title="Navegadores">
                <ul className="space-y-2">
                  {stats.porNavegador.map((n) => (
                    <li key={n.browser} className="flex justify-between text-sm">
                      <span>{n.browser}</span>
                      <span className="font-medium">{n.total}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
            {stats.referrers.length > 0 && (
              <Section title="Origen del tráfico (referrers)">
                <ul className="space-y-2">
                  {stats.referrers.map((r) => (
                    <li key={r.referrerHost} className="flex justify-between text-sm">
                      <span className="truncate max-w-[200px]" title={r.referrerHost}>
                        {r.referrerHost}
                      </span>
                      <span className="font-medium">{r.total}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>

          <p className="mt-10 text-xs text-gray-500">
            Datos desde {stats.periodo.desde.slice(0, 10)}. La app móvil podrá enviar
            datos en el futuro (source: app).
          </p>
        </>
      )}
    </main>
  );
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: number | string;
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}
