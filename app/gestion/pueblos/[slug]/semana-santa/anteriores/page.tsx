'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { GestionPuebloSubpageShell } from '../../../_components/GestionPuebloSubpageShell';
import { HeroIconCross } from '../../../_components/gestion-pueblo-hero-icons';

interface EdicionItem {
  id: number;
  anio: number;
  cartelHorizontalUrl: string | null;
  cartelVerticalUrl: string | null;
  updatedAt?: string;
  _count?: { agenda: number; dias: number };
}

export default function GestionPuebloSemanaSantaAnterioresPage() {
  const { slug } = useParams<{ slug: string }>();

  const [puebloId, setPuebloId] = useState<number | null>(null);
  const [activeAnio, setActiveAnio] = useState<number | null>(null);
  const [ediciones, setEdiciones] = useState<EdicionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/pueblos/${slug}`);
        if (res.ok) {
          const p = await res.json();
          setPuebloId(p.id);
        }
      } catch { /* ignore */ }
    })();
  }, [slug]);

  const load = useCallback(async () => {
    if (!puebloId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/semana-santa/pueblos/by-pueblo/${puebloId}/ediciones`,
        { credentials: 'include', cache: 'no-store' },
      );
      if (res.status === 401) { window.location.href = '/entrar'; return; }
      if (!res.ok) throw new Error('No se pudieron cargar las ediciones');
      const body = await res.json();
      const lista: EdicionItem[] = Array.isArray(body) ? body : (body.ediciones ?? []);
      const active: number | null = body?.activeAnio ?? null;
      setActiveAnio(active);
      setEdiciones(
        lista
          .filter((e) => active == null || e.anio !== active)
          .sort((a, b) => b.anio - a.anio),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [puebloId]);

  useEffect(() => { if (puebloId) load(); }, [puebloId, load]);

  return (
    <GestionPuebloSubpageShell
      slug={slug}
      title="Ediciones anteriores"
      subtitle={
        <>
          Semana Santa · <span className="font-semibold text-white/95">{slug}</span>
        </>
      }
      heroIcon={<HeroIconCross />}
      maxWidthClass="max-w-5xl"
    >
      <div className="mb-6">
        <Link
          href={`/gestion/pueblos/${slug}/semana-santa`}
          className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-800 transition hover:bg-stone-100"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a la edición {activeAnio ?? 'actual'}
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-stone-200 bg-stone-50/60 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">Tus ediciones anteriores</h2>
        <p className="mt-1 text-sm text-stone-700">
          Cada año de Semana Santa queda guardado tal cual lo dejasteis. Puedes consultar
          cualquier edición pasada y, si quieres, <strong>importar a la edición actual</strong>{' '}
          (la de {activeAnio ?? 'este año'}) la información, los carteles, los días o la
          agenda de actos. Las fechas de la agenda se trasladan automáticamente al año
          actual; tras importar podrás repasarlas y editarlas.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando ediciones…</p>
      ) : ediciones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-muted-foreground">
          Todavía no hay ediciones anteriores guardadas para tu pueblo.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ediciones.map((e) => {
            const cartel = e.cartelHorizontalUrl || e.cartelVerticalUrl;
            return (
              <Link
                key={e.id}
                href={`/gestion/pueblos/${slug}/semana-santa/anteriores/${e.anio}`}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-stone-400 hover:shadow-md"
              >
                {cartel ? (
                  <img
                    src={cartel}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-lg object-cover ring-1 ring-stone-200"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-2xl">
                    ✝️
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-stone-900">{e.anio}</span>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                      archivo
                    </span>
                  </div>
                  {e._count && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {e._count.dias} día{e._count.dias === 1 ? '' : 's'}
                      {' · '}
                      {e._count.agenda} acto{e._count.agenda === 1 ? '' : 's'} en agenda
                    </p>
                  )}
                  <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-stone-700 group-hover:text-stone-900">
                    Ver edición
                    <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </GestionPuebloSubpageShell>
  );
}
