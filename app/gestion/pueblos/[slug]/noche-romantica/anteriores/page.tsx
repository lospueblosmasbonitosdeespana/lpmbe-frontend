'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { GestionPuebloSubpageShell } from '../../../_components/GestionPuebloSubpageShell';
import { HeroIconHeart } from '../../../_components/gestion-pueblo-hero-icons';

interface EdicionItem {
  id: number;
  anio: number;
  cartelUrl: string | null;
  updatedAt?: string;
  _count?: { actividades: number; negocios: number };
}

export default function GestionPuebloNocheRomanticaAnterioresPage() {
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
        `/api/admin/noche-romantica/pueblos/by-pueblo/${puebloId}/ediciones`,
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
    } catch (e: any) {
      setError(e?.message ?? 'Error');
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
          La Noche Romántica · <span className="font-semibold text-white/95">{slug}</span>
        </>
      }
      heroIcon={<HeroIconHeart />}
      theme="nocheRomantica"
    >
      <div className="mb-6">
        <Link
          href={`/gestion/pueblos/${slug}/noche-romantica`}
          className="inline-flex items-center gap-2 rounded-lg border border-pink-200 bg-pink-50/40 px-3 py-2 text-sm font-medium text-pink-900 transition hover:bg-pink-100"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a la edición {activeAnio ?? 'actual'}
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-pink-200/70 bg-gradient-to-br from-pink-50/70 via-fuchsia-50/40 to-violet-50/30 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-pink-950">Tus ediciones anteriores</h2>
        <p className="mt-1 text-sm text-pink-900/80">
          Cada año de La Noche Romántica queda guardado tal cual lo dejasteis. Puedes consultar
          cualquier edición pasada y, si quieres, <strong>importar a la edición actual</strong>{' '}
          (la de {activeAnio ?? 'este año'}) la información, el cartel, las actividades o los
          negocios que ya tenías. Después podrás editar lo que importes.
        </p>
        <p className="mt-2 text-xs text-pink-900/70">
          <strong>Recuerda:</strong> La Noche Romántica cae cada año en el sábado más cercano al
          solsticio de verano, así que <strong>la fecha cambia</strong>. Tras importar, repasa los
          horarios de actividades y los textos por si había menciones a la fecha del año pasado.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando ediciones…</p>
      ) : ediciones.length === 0 ? (
        <div className="rounded-xl border border-dashed border-pink-200 bg-white p-8 text-center text-sm text-muted-foreground">
          Todavía no hay ediciones anteriores guardadas para tu pueblo.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ediciones.map((e) => (
            <Link
              key={e.id}
              href={`/gestion/pueblos/${slug}/noche-romantica/anteriores/${e.anio}`}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-pink-300 hover:shadow-md"
            >
              {e.cartelUrl ? (
                <img
                  src={e.cartelUrl}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-lg object-cover ring-1 ring-pink-100"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-pink-50 p-2">
                  <Image
                    src="/eventos/noche-romantica.png"
                    alt="La Noche Romántica"
                    width={120}
                    height={170}
                    className="h-full w-auto object-contain"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight text-pink-950">{e.anio}</span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                    archivo
                  </span>
                </div>
                {e._count && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {e._count.actividades} actividad{e._count.actividades === 1 ? '' : 'es'}
                    {' · '}
                    {e._count.negocios} negocio{e._count.negocios === 1 ? '' : 's'}
                  </p>
                )}
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-pink-700 group-hover:text-pink-900">
                  Ver edición
                  <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </GestionPuebloSubpageShell>
  );
}
