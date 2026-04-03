import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SemaforoGestion from './SemaforoGestion.client';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

export default async function SemaforoPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  if (me.rol === 'ALCALDE') {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect('/gestion/mis-pueblos');
  }

  const pueblo = await getPuebloBySlug(slug);
  const s = (pueblo as any)?.semaforo ?? null;

  const estadoManual: string = s?.estado_manual ?? s?.estado ?? 'VERDE';
  const estadoEfectivo: string = s?.estado ?? 'VERDE';
  const mensajePublicoManual: string = s?.mensaje_publico ?? '';
  const mensajeInternoManual: string = s?.mensaje ?? '';
  const caducaEn: string | null = s?.caduca_en ?? null;
  const ultimaActualizacion: string | null = s?.ultima_actualizacion ?? s?.ultimaActualizacion ?? null;

  // Array de eventos programados futuros
  const eventosProgramados: any[] = s?.programado_eventos_list ?? (s?.programado ? [s.programado] : []);

  const estadoPublicoLabel =
    estadoEfectivo === 'ROJO'
      ? 'Rojo'
      : estadoEfectivo === 'AMARILLO'
        ? 'Amarillo'
        : 'Verde';
  const numEventos = eventosProgramados.length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
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
        style={{ background: 'linear-gradient(135deg, #a0705a 0%, #b8856d 40%, #c49a82 100%)' }}
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/6 blur-3xl" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-inner backdrop-blur-sm">
              <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-white/90" />
                <circle cx="12" cy="7" r="2.5" fill="#fecaca" />
                <circle cx="12" cy="12" r="2.5" fill="#fde047" />
                <circle cx="12" cy="17" r="2.5" fill="#86efac" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Semáforo turístico</h1>
              <p className="mt-0.5 text-sm text-white/80">
                Afluencia e incidencias visibles en la ficha del pueblo ·{' '}
                <span className="font-semibold text-white/95">{pueblo.nombre}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
              <span className="text-xs font-medium uppercase tracking-wide text-white/70">Estado público</span>
              <p className="text-lg font-bold leading-tight">{estadoPublicoLabel}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
              <span className="text-lg font-bold">{numEventos}</span>
              <span className="ml-1.5 text-xs text-white/70">
                {numEventos === 1 ? 'evento programado' : 'eventos programados'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <SemaforoGestion
        puebloId={pueblo.id}
        slug={slug}
        estadoManual={estadoManual}
        estadoEfectivo={estadoEfectivo}
        mensajePublicoManual={mensajePublicoManual}
        mensajeInternoManual={mensajeInternoManual}
        caducaEn={caducaEn}
        ultimaActualizacion={ultimaActualizacion}
        eventosProgramados={eventosProgramados}
        key={`${pueblo.id}-${ultimaActualizacion ?? 'na'}`}
      />

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
