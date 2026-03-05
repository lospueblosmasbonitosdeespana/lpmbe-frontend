'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type PuebloRecursos = { id: number; nombre: string; slug: string; count: number };

export default function RecursosPueblosClient() {
  const [items, setItems] = useState<PuebloRecursos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/club/admin/pueblos-recursos')
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar los datos');
        return res.json();
      })
      .then((data: PuebloRecursos[]) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? 'Error desconocido');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-500">
        Cargando pueblos…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const totalRecursos = items.reduce((s, p) => s + p.count, 0);
  const pueblosConRecursos = items.filter((p) => p.count > 0).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="rounded-full bg-gray-100 px-3 py-1 font-medium text-gray-700">
          {items.length} pueblos
        </span>
        <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
          {pueblosConRecursos} con recursos
        </span>
        <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-800">
          {totalRecursos} recursos en total
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Pueblo</th>
                <th className="px-4 py-3 text-center w-28">Recursos</th>
                <th className="px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                    No hay datos
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{p.nombre}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-2 font-semibold ${
                          p.count > 0 ? 'bg-primary/15 text-primary' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {p.count}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/gestion/pueblos/${p.slug}/club`}
                        className="text-primary hover:underline font-medium"
                      >
                        Ver recursos →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
