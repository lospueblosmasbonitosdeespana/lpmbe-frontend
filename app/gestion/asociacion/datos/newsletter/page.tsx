'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type SubItem = { id: number; email: string; origen: string; createdAt: string };
type Stats = {
  total: number;
  hoy: number;
  semana: number;
  mes: number;
  ultimos7Dias: { fecha: string; count: number }[];
};

const PERIODOS = [
  { value: 'total', label: 'Total' },
  { value: 'mes', label: 'Este mes' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'hoy', label: 'Hoy' },
];

type ExportFormat = 'csv' | 'json' | 'txt' | 'xlsx';

function buildEmailsList(items: SubItem[]): string {
  return items.map((i) => i.email).join('\n');
}

function buildCsv(items: SubItem[]): string {
  const headers = 'email,origen,fecha';
  const rows = items.map(
    (i) => `${i.email},${i.origen},${new Date(i.createdAt).toISOString()}`
  );
  return [headers, ...rows].join('\n');
}

function buildJson(items: SubItem[]): string {
  return JSON.stringify(items, null, 2);
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DatosNewsletterPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<SubItem[]>([]);
  const [total, setTotal] = useState(0);
  const [periodo, setPeriodo] = useState('total');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function loadStats() {
    try {
      const res = await fetch('/api/admin/newsletter/stats', { cache: 'no-store' });
      if (res.ok) setStats(await res.json());
    } catch {}
  }

  async function loadList() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/admin/newsletter?periodo=${periodo}&limit=50000`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err?.message ?? 'Error cargando suscriptores');
      }
    } catch (e) {
      setError('Error cargando suscriptores');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadList();
  }, [periodo]);

  function handleCopy(emails: string) {
    navigator.clipboard.writeText(emails).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleExport(format: ExportFormat) {
    const now = new Date().toISOString().slice(0, 10);
    const baseName = `newsletter-suscriptores-${periodo}-${now}`;

    switch (format) {
      case 'txt':
        downloadBlob(buildEmailsList(items), `${baseName}.txt`, 'text/plain');
        break;
      case 'csv':
        downloadBlob(buildCsv(items), `${baseName}.csv`, 'text/csv');
        break;
      case 'json':
        downloadBlob(buildJson(items), `${baseName}.json`, 'application/json');
        break;
      case 'xlsx':
        // CSV con BOM para Excel (abre correctamente con caracteres especiales)
        const csvExcel = '\uFEFF' + buildCsv(items);
        downloadBlob(csvExcel, `${baseName}.csv`, 'text/csv;charset=utf-8');
        break;
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion/datos"
          className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-900"
        >
          ← Volver a Datos
        </Link>
        <h1 className="text-3xl font-bold">Newsletter</h1>
        <p className="mt-2 text-gray-600">
          Suscriptores, contadores y exportación para envío de newsletters
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      {/* CONTADORES */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <StatCard title="Total" value={stats?.total ?? 0} />
        <StatCard title="Hoy" value={stats?.hoy ?? 0} />
        <StatCard title="Esta semana" value={stats?.semana ?? 0} />
        <StatCard title="Este mes" value={stats?.mes ?? 0} />
      </div>

      {stats?.ultimos7Dias && stats.ultimos7Dias.length > 0 && (
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 font-semibold">Últimos 7 días</h3>
          <div className="flex flex-wrap gap-4">
            {stats.ultimos7Dias.map((d) => (
              <div key={d.fecha} className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {new Date(d.fecha).toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-sm font-medium">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FILTRO PERIODO + ACCIONES */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div>
          <label className="mr-2 text-sm text-gray-600">Período:</label>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm"
          >
            {PERIODOS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <span className="text-sm text-gray-500">
          {items.length} de {total} emails
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={() => handleCopy(buildEmailsList(items))}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={items.length === 0}
          >
            {copied ? '✓ Copiado' : 'Copiar emails'}
          </button>
          <button
            onClick={() => handleExport('txt')}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            disabled={items.length === 0}
          >
            Exportar TXT
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            disabled={items.length === 0}
          >
            Exportar CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            disabled={items.length === 0}
          >
            Exportar JSON
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            disabled={items.length === 0}
          >
            Exportar Excel
          </button>
        </div>
      </div>

      {/* LISTA */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay suscriptores en este período
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Origen
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{item.email}</td>
                    <td className="px-4 py-2 text-sm text-gray-600">{item.origen}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Los emails se pueden pegar directamente en Mailchimp, Sendinblue u otras
        herramientas de email marketing. Formato: un email por línea.
      </p>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
