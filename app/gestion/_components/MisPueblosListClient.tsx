'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export type MisPuebloItem = { id: number; nombre: string; slug: string; provincia?: string | null };

const CARD_ACCENTS = [
  'border-emerald-200/70 from-emerald-50/80 to-white dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-card',
  'border-sky-200/70 from-sky-50/80 to-white dark:border-sky-900/40 dark:from-sky-950/30 dark:to-card',
  'border-violet-200/70 from-violet-50/70 to-white dark:border-violet-900/40 dark:from-violet-950/25 dark:to-card',
  'border-amber-200/70 from-amber-50/70 to-white dark:border-amber-900/40 dark:from-amber-950/25 dark:to-card',
  'border-rose-200/70 from-rose-50/70 to-white dark:border-rose-900/40 dark:from-rose-950/25 dark:to-card',
  'border-teal-200/70 from-teal-50/80 to-white dark:border-teal-900/40 dark:from-teal-950/25 dark:to-card',
] as const;

function initialLetter(nombre: string): string {
  const c = (nombre || '?').trim().charAt(0);
  return c ? c.toUpperCase() : '?';
}

export default function MisPueblosListClient({ pueblos }: { pueblos: MisPuebloItem[] }) {
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return pueblos;
    return pueblos.filter((p) => {
      const prov = (p.provincia || '').toLowerCase();
      return (
        (p.nombre || '').toLowerCase().includes(t) ||
        (p.slug || '').toLowerCase().includes(t) ||
        prov.includes(t)
      );
    });
  }, [pueblos, q]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <label htmlFor="mis-pueblos-buscar" className="sr-only">
            Buscar pueblo
          </label>
          <input
            id="mis-pueblos-buscar"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, provincia o slug…"
            className="w-full max-w-md rounded-xl border border-input bg-background px-4 py-2.5 text-sm shadow-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus-visible:border-emerald-400/60 focus-visible:ring-2 focus-visible:ring-emerald-500/25 sm:w-80"
            autoComplete="off"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{filtered.length}</span>
          {filtered.length === 1 ? ' pueblo' : ' pueblos'}
          {q.trim() && filtered.length !== pueblos.length ? (
            <span className="text-muted-foreground"> · de {pueblos.length}</span>
          ) : null}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
          <p className="font-medium text-foreground">Ningún pueblo coincide con la búsqueda</p>
          <p className="mt-1 text-sm text-muted-foreground">Prueba con otro término o borra el filtro.</p>
          {q.trim() ? (
            <button
              type="button"
              onClick={() => setQ('')}
              className="mt-4 text-sm font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
            >
              Limpiar búsqueda
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filtered.map((p) => {
            const accent = CARD_ACCENTS[Math.abs(p.id) % CARD_ACCENTS.length];
            const sub = (p.provincia || '').trim() || '—';
            return (
              <li
                key={p.id}
                className={cn(
                  'group flex flex-col rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                  accent,
                )}
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/60 bg-white/80 text-lg font-bold text-slate-700 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-100"
                    aria-hidden
                  >
                    {initialLetter(p.nombre || '')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-foreground">{p.nombre || `Pueblo ${p.id}`}</div>
                    <div className="mt-0.5 truncate text-sm text-muted-foreground">{sub}</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4">
                  <Link
                    href={`/pueblos/${p.slug}`}
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-background/80 px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/80"
                  >
                    Ver ficha
                  </Link>
                  <Link
                    href={`/gestion/pueblos/${p.slug}`}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:flex-none dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    Gestionar
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
