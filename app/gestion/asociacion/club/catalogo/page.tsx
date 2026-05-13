'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Tone = 'red' | 'amber' | 'lime' | 'green' | 'blue';

type Item = {
  puebloId: number;
  slug: string;
  nombre: string;
  provincia: string;
  comunidad: string;
  totalRrtt: number;
  totalNaturales: number;
  totalRecursos: number;
  estado: string;
  tone: Tone;
  estadoRrtt: string;
  toneRrtt: Tone;
  estadoNaturales: string;
  toneNaturales: Tone;
};

type Resp = {
  resumen: {
    totalPueblos: number;
    conRrtt: number;
    sinRrtt: number;
    conNaturales: number;
    sinNaturales: number;
    porEstadoRrtt: Record<string, number>;
    porEstadoNaturales: Record<string, number>;
  };
  items: Item[];
};

const TONE_CLASSES: Record<Tone, string> = {
  red: 'bg-red-100 text-red-800',
  amber: 'bg-amber-100 text-amber-800',
  lime: 'bg-lime-100 text-lime-800',
  green: 'bg-green-100 text-green-800',
  blue: 'bg-blue-100 text-blue-800',
};

type FiltroId = 'all' | 'vacios' | 'incompletos' | 'completos';
const FILTERS: Array<{ id: FiltroId; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'vacios', label: 'Vacíos (0)' },
  { id: 'incompletos', label: 'Incompletos (≤5)' },
  { id: 'completos', label: 'Bien (≥6)' },
];

type CategoriaFiltro = 'rrtt' | 'naturales' | 'total';

export default function CatalogoEstadoPage() {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<CategoriaFiltro>('rrtt');
  const [filter, setFilter] = useState<FiltroId>('incompletos');
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/club/admin/catalogo-estado', {
          cache: 'no-store',
        });
        if (res.ok) setData(await res.json());
        else setError((await res.json().catch(() => ({})))?.message ?? 'Error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const items = useMemo(() => {
    if (!data) return [];
    const getTotal = (i: Item) =>
      categoria === 'rrtt'
        ? i.totalRrtt
        : categoria === 'naturales'
          ? i.totalNaturales
          : i.totalRecursos;
    let arr = data.items;
    if (filter === 'vacios') arr = arr.filter((i) => getTotal(i) === 0);
    else if (filter === 'incompletos') arr = arr.filter((i) => getTotal(i) <= 5);
    else if (filter === 'completos') arr = arr.filter((i) => getTotal(i) >= 6);
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      arr = arr.filter(
        (i) =>
          i.nombre.toLowerCase().includes(term) ||
          (i.provincia ?? '').toLowerCase().includes(term),
      );
    }
    return arr;
  }, [data, categoria, filter, q]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href="/gestion/asociacion/club"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-gray-900"
      >
        ← Volver al Club
      </Link>
      <h1 className="mb-2 text-3xl font-bold">Estado del catálogo</h1>
      <p className="mb-8 text-muted-foreground">
        Diagnóstico de cuántos recursos tiene cada pueblo, separados por
        <strong> RRTT</strong> (museos, monasterios, castillos, ermitas… validados con QR)
        y <strong>Recursos Naturales</strong> (cascadas, parajes, miradores… validados por GPS).
        Útil para detectar pueblos con catálogo vacío o insuficiente.
      </p>

      {data && (
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Pueblos en la red" value={String(data.resumen.totalPueblos)} />
          <Stat
            label="Con RRTT"
            value={`${data.resumen.conRrtt} / ${data.resumen.totalPueblos}`}
            tone="blue"
          />
          <Stat
            label="Con Naturales"
            value={`${data.resumen.conNaturales} / ${data.resumen.totalPueblos}`}
            tone="blue"
          />
          <Stat
            label={categoria === 'rrtt' ? 'RRTT por estado' : categoria === 'naturales' ? 'Naturales por estado' : 'Total por estado'}
            value={Object.entries(
              categoria === 'rrtt'
                ? data.resumen.porEstadoRrtt
                : categoria === 'naturales'
                  ? data.resumen.porEstadoNaturales
                  : data.resumen.porEstadoRrtt,
            )
              .map(([k, v]) => `${k}: ${v}`)
              .join(' · ')}
            small
          />
        </section>
      )}

      {/* Selector de categoría */}
      <div className="mb-3 inline-flex rounded-xl border border-border bg-white p-1 text-xs font-semibold">
        {(
          [
            { id: 'rrtt', label: 'RRTT (QR)' },
            { id: 'naturales', label: 'Naturales (GPS)' },
            { id: 'total', label: 'Total combinado' },
          ] as Array<{ id: CategoriaFiltro; label: string }>
        ).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoria(c.id)}
            className={`rounded-lg px-3 py-1.5 transition-colors ${
              categoria === c.id
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              filter === f.id
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-border bg-white'
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
                  RRTT
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Naturales
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
                      <CategoriaBadge
                        total={i.totalRrtt}
                        estado={i.estadoRrtt}
                        tone={i.toneRrtt}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <CategoriaBadge
                        total={i.totalNaturales}
                        estado={i.estadoNaturales}
                        tone={i.toneNaturales}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/gestion/pueblos/${i.slug}/club`}
                        className="text-blue-600 hover:underline"
                      >
                        Gestionar pueblo
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

function CategoriaBadge({
  total,
  estado,
  tone,
}: {
  total: number;
  estado: string;
  tone: Tone;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-sm font-semibold text-gray-900">{total}</span>
      <span
        className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${TONE_CLASSES[tone]}`}
      >
        {estado}
      </span>
    </div>
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
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-2 ${small ? 'text-sm font-medium' : 'text-2xl font-bold'} ${
          tone === 'blue'
            ? 'text-blue-700'
            : tone === 'red'
              ? 'text-red-700'
              : 'text-gray-900'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
