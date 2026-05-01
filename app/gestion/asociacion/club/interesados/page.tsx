'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Lead = {
  id: number;
  email: string;
  idiomaPreferido: string | null;
  source: string;
  ip: string | null;
  createdAt: string;
};

type Resp = {
  items: Lead[];
  total: number;
  take: number;
  skip: number;
};

function fmtFecha(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ClubInteresadosPage() {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/club/admin/lead-prelanzamiento?take=500', {
          cache: 'no-store',
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json?.message ?? `Error ${res.status}`);
        }
        if (!cancelled) setData(json as Resp);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Error cargando interesados');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const items = data?.items ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (x) =>
        x.email.toLowerCase().includes(q) ||
        (x.idiomaPreferido ?? '').toLowerCase().includes(q) ||
        (x.source ?? '').toLowerCase().includes(q),
    );
  }, [data?.items, search]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href="/gestion/asociacion/club"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Volver a Club
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Interesados en Club</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Lista de usuarios que han pulsado “Avísame cuando se abra”.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <p className="text-xs text-muted-foreground">Total en lista</p>
          <p className="text-xl font-bold text-foreground">{data?.total ?? 0}</p>
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por email, idioma o source..."
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          Cargando interesados...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Idioma</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Origen</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Fecha alta</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                    No hay resultados
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2.5 font-medium text-foreground">{lead.email}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {lead.idiomaPreferido || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{lead.source || '—'}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{fmtFecha(lead.createdAt)}</td>
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

