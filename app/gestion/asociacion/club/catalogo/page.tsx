'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Item = {
  puebloId: number;
  slug: string;
  nombre: string;
  provincia: string;
  comunidad: string;
  totalRecursos: number;
  estado: 'Vacío' | 'Mínimo' | 'Básico' | 'Bueno' | 'Completo';
  tone: 'red' | 'amber' | 'lime' | 'green' | 'blue';
};

type Resp = {
  resumen: {
    totalPueblos: number;
    conRecursos: number;
    sinRecursos: number;
    porEstado: Record<string, number>;
  };
  items: Item[];
};

const TONE_CLASSES: Record<Item['tone'], string> = {
  red: 'bg-red-100 text-red-800',
  amber: 'bg-amber-100 text-amber-800',
  lime: 'bg-lime-100 text-lime-800',
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
};

const FILTERS: Array<{ id: 'all' | 'incompletos' | 'vacios' | 'completos'; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'vacios', label: 'Vacíos (0 RRTT)' },
  { id: 'incompletos', label: 'Incompletos (≤5 RRTT)' },
  { id: 'completos', label: 'Bien (≥6 RRTT)' },
];

export default function CatalogoEstadoPage() {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('incompletos');
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/club/admin/catalogo-estado', { cache: 'no-store' });
        if (res.ok) setData(await res.json());
        else setError((await res.json().catch(() => ({})))?.message ?? 'Error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const items = useMemo(() => {
    if (!data) return [];
    let arr = data.items;
    if (filter === 'vacios') arr = arr.filter((i) => i.totalRecursos === 0);
    else if (filter === 'incompletos') arr = arr.filter((i) => i.totalRecursos <= 5);
    else if (filter === 'completos') arr = arr.filter((i) => i.totalRecursos >= 6);
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      arr = arr.filter(
        (i) =>
          i.nombre.toLowerCase().includes(term) ||
          (i.provincia ?? '').toLowerCase().includes(term),
      );
    }
    return arr;
  }, [data, filter, q]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href="/gestion/asociacion/club"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-gray-900"
      >
        ← Volver al Club
      </Link>
      <h1 className="mb-2 text-3xl font-bold">Estado del catálogo de RRTT</h1>
      <p className="mb-8 text-muted-foreground">
        Diagnóstico de cuántos recursos turísticos tiene cada pueblo (con descuentos del Club). Útil
        para identificar pueblos con catálogo vacío o insuficiente y avisar al alcalde.
      </p>

      {data && (
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Pueblos en la red" value={String(data.resumen.totalPueblos)} />
          <Stat label="Con catálogo" value={String(data.resumen.conRecursos)} tone="blue" />
          <Stat label="Sin catálogo" value={String(data.resumen.sinRecursos)} tone="red" />
          <Stat
            label="Por estado"
            value={Object.entries(data.resumen.porEstado)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' · ')}
            small
          />
        </section>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              filter === f.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-border bg-white'
            }`}
          >
            {f.label}
          </button>
        ))}
        <input
          type="search"
          placeholder="Buscar pueblo o provincia…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="ml-auto rounded-lg border border-border px-3 py-1.5 text-sm"
        />
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</div>}

      {loading ? (
        <div className="animate-pulse rounded-lg bg-muted p-8">Cargando…</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Pueblo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Provincia
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Estado
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  RRTT activos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    Sin resultados
                  </td>
                </tr>
              ) : (
                items.map((i) => (
                  <tr key={i.puebloId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-gray-900">{i.nombre}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{i.provincia}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[i.tone]}`}>
                        {i.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">{i.totalRecursos}</td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/gestion/pueblos/${i.slug}`}
                        className="text-blue-600 hover:underline"
                      >
                        Gestionar pueblo
                      </Link>
                      {' · '}
                      <Link
                        href={`/gestion/pueblos/${i.slug}/recursos-turisticos`}
                        className="text-blue-600 hover:underline"
                      >
                        Añadir RRTT
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
  small,
}: {
  label: string;
  value: string;
  tone?: 'blue' | 'red';
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`mt-2 ${small ? 'text-sm font-medium' : 'text-2xl font-bold'} ${
          tone === 'blue' ? 'text-blue-700' : tone === 'red' ? 'text-red-700' : 'text-gray-900'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
