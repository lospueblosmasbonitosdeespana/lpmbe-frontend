import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import CaracteristicasClient from './CaracteristicasClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const HERO_BG =
  'linear-gradient(135deg, #a0705a 0%, #b8856d 40%, #c49a82 100%)';

export default async function CaracteristicasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN' && me.rol !== 'EDITOR') {
    redirect('/cuenta');
  }

  if (me.rol === 'ALCALDE') {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect('/gestion/mis-pueblos');
  }

  let pueblo: { id: number; nombre: string } | null = null;
  try {
    const raw = await getPuebloBySlug(slug);
    if (raw?.id) {
      pueblo = { id: raw.id, nombre: raw.nombre ?? slug };
    }
  } catch {
    // fallback
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href={`/gestion/pueblos/${slug}`}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-primary/25 hover:bg-muted/50 hover:text-foreground"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a gestión del pueblo
      </Link>

      <div
        className="relative mb-8 overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={{ background: HERO_BG }}
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/8 blur-3xl" aria-hidden />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/6 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-inner backdrop-blur-sm">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M10 21V7l2-4 2 4v14" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Características del pueblo
              </h1>
              <p className="mt-0.5 text-sm text-white/80">
                {pueblo?.nombre ?? slug} — Marca lo que tiene tu pueblo para aparecer en las colecciones temáticas
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        Selecciona las características reales de tu pueblo: patrimonio, naturaleza, gastronomía, servicios…
        Estos datos permiten que el pueblo aparezca en las{' '}
        <span className="font-medium text-foreground">colecciones temáticas</span> de la web
        (ej. &quot;Pueblos con castillo&quot;, &quot;Pueblos con piscinas naturales&quot;).
      </div>

      {!pueblo?.id ? (
        <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          No se pudo obtener el pueblo. Inténtalo de nuevo más tarde.
        </div>
      ) : (
        <CaracteristicasClient puebloId={pueblo.id} slug={slug} puebloNombre={pueblo.nombre} />
      )}

      <div className="mt-10 border-t border-border/60 pt-6">
        <Link
          href={`/gestion/pueblos/${slug}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a gestión del pueblo
        </Link>
      </div>
    </main>
  );
}
