'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type PuebloRecursos = {
  id: number;
  nombre: string;
  slug: string;
  recursosCount: number;
  negociosCount: number;
};

/** Respuesta legacy (antes de separar RRTT / negocios) */
type PuebloRecursosLegacy = { id: number; nombre: string; slug: string; count?: number };

function normalizeRow(p: PuebloRecursos | PuebloRecursosLegacy): PuebloRecursos {
  const legacy = p as PuebloRecursosLegacy;
  if (typeof legacy.count === 'number' && legacy.recursosCount === undefined) {
    return {
      id: p.id,
      nombre: p.nombre,
      slug: p.slug,
      recursosCount: legacy.count,
      negociosCount: 0,
    };
  }
  return p as PuebloRecursos;
}

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
      .then((data: PuebloRecursos[] | PuebloRecursosLegacy[]) => {
        if (!cancelled) setItems(Array.isArray(data) ? data.map(normalizeRow) : []);
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
      <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
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

  const totalRrt = items.reduce((s, p) => s + p.recursosCount, 0);
  const totalNegocios = items.reduce((s, p) => s + p.negociosCount, 0);
  const pueblosConRrt = items.filter((p) => p.recursosCount > 0).length;
  const pueblosConNegocios = items.filter((p) => p.negociosCount > 0).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        <strong>Recursos municipio (RRTT):</strong> museos, monumentos y atractivos gestionados en la página Club del
        pueblo. <strong>Negocios:</strong> hoteles, restaurantes y comercios del Club, gestión en Negocios.
      </p>

      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-muted px-3 py-1 font-medium text-gray-700">
          {items.length} pueblos
        </span>
        <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
          {pueblosConRrt} con RRTT
        </span>
        <span className="rounded-full bg-teal-100 px-3 py-1 font-medium text-teal-900 dark:bg-teal-900/30 dark:text-teal-200">
          {pueblosConNegocios} con negocios
        </span>
        <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
          {totalRrt} RRTT en total
        </span>
        <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
          {totalNegocios} negocios en total
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/30 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Pueblo</th>
                <th className="px-4 py-3 text-center w-24" title="Recursos turísticos del municipio (Club)">
                  RRTT
                </th>
                <th className="px-4 py-3 text-center w-24" title="Negocios del Club (hoteles, restaurantes…)">
                  Negocios
                </th>
                <th className="px-4 py-3">Enlaces</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No hay datos
                  </td>
                </tr>
              ) : (
                items.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{p.nombre}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-2 font-semibold ${
                          p.recursosCount > 0 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {p.recursosCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full px-2 font-semibold ${
                          p.negociosCount > 0
                            ? 'bg-teal-100 text-teal-900 dark:bg-teal-900/40 dark:text-teal-200'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {p.negociosCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <Link
                          href={`/gestion/pueblos/${p.slug}/club`}
                          className="font-medium text-primary hover:underline"
                        >
                          Ver RRTT →
                        </Link>
                        <Link
                          href={`/gestion/asociacion/negocios/${p.slug}`}
                          className="font-medium text-teal-700 hover:underline dark:text-teal-400"
                        >
                          Ver negocios →
                        </Link>
                      </div>
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
