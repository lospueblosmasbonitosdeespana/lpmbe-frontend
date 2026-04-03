'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type PuebloNegocios = { id: number; nombre: string; slug: string; count: number };

export default function NegociosIndexClient() {
  const [items, setItems] = useState<PuebloNegocios[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch('/api/club/negocios/pueblos')
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar los datos');
        return res.json();
      })
      .then((data: PuebloNegocios[]) => {
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
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        Cargando pueblos&hellip;
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

  const totalNegocios = items.reduce((s, p) => s + p.count, 0);
  const pueblosConNegocios = items.filter((p) => p.count > 0).length;

  const filtered = search.trim()
    ? items.filter((p) => p.nombre.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="rounded-full bg-muted px-3 py-1 font-medium text-foreground/80">
          {items.length} pueblos
        </span>
        <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
          {pueblosConNegocios} con negocios
        </span>
        <span className="rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 font-medium text-green-800 dark:text-green-300">
          {totalNegocios} negocios en total
        </span>
      </div>

      {/* Asociacion button */}
      <Link
        href="/gestion/asociacion/negocios/asociacion-general"
        className="flex items-center justify-between rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 transition-colors hover:border-primary hover:bg-primary/10"
      >
        <div>
          <span className="font-semibold text-primary">Asociaci&oacute;n</span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Negocios no vinculados a un pueblo concreto
          </p>
        </div>
        <span className="text-primary font-medium text-sm">Ver negocios &rarr;</span>
      </Link>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar pueblo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />

      {/* Pueblos grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Link
            key={p.id}
            href={`/gestion/asociacion/negocios/${p.slug}`}
            className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
          >
            <div className="min-w-0">
              <span className="block truncate font-medium text-foreground group-hover:text-primary">
                {p.nombre}
              </span>
            </div>
            <span
              className={`ml-3 inline-flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-full px-2 text-xs font-semibold ${
                p.count > 0 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
              }`}
            >
              {p.count}
            </span>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No se encontraron pueblos con ese nombre.
        </p>
      )}
    </div>
  );
}
