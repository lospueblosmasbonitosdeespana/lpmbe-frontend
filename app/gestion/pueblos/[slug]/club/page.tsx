import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ClubRecursos from './ClubRecursos.client';
import ClubRecursosRurales from './ClubRecursosRurales.client';
import MetricasResumen from './MetricasResumen.client';
import { GestionPuebloSubpageShell } from '../../_components/GestionPuebloSubpageShell';
import { HeroIconUsers } from '../../_components/gestion-pueblo-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

export default async function ClubGestionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  // Si es ALCALDE, verificamos que el pueblo está en su lista.
  if (me.rol === 'ALCALDE') {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect('/gestion/mis-pueblos');
  }

  // Cargar pueblo real
  const pueblo = await getPuebloBySlug(slug);

  return (
    <GestionPuebloSubpageShell
      slug={slug}
      title="El Club de los más Bonitos"
      subtitle={
        <>
          Recursos turísticos y métricas del club ·{' '}
          <span className="font-semibold text-white/95">{pueblo.nombre}</span>
        </>
      }
      heroIcon={<HeroIconUsers />}
    >
      <p className="mb-6 text-sm text-muted-foreground">
        ID pueblo: <strong>{pueblo.id}</strong>
      </p>

      {/* Acceso directo al validador de escritorio (pistola QR / teclado) */}
      <Link
        href={`/gestion/pueblos/${slug}/validador`}
        className="mb-6 flex items-center justify-between gap-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-4 text-amber-900 shadow-sm transition-colors hover:border-amber-400 hover:from-amber-100 sm:p-5"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-800">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
              <path d="M3 7V5a2 2 0 0 1 2-2h2" />
              <path d="M17 3h2a2 2 0 0 1 2 2v2" />
              <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
              <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
              <rect x="7" y="7" width="3" height="3" />
              <rect x="14" y="7" width="3" height="3" />
              <rect x="7" y="14" width="3" height="3" />
              <path d="M14 14h3v3M14 17h3" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold">Validador QR (escritorio)</p>
            <p className="text-sm text-amber-800/80">
              Pistola lectora o teclado para validar carnets del Club en el ordenador del ayuntamiento o del negocio.
            </p>
          </div>
        </div>
        <span className="hidden shrink-0 rounded-full bg-amber-600 px-4 py-2 text-sm font-bold text-white sm:inline-flex">
          Abrir →
        </span>
      </Link>

      <div className="mb-6 rounded-2xl border border-border/80 bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-medium">Métricas del municipio (todos los recursos)</div>
            <MetricasResumen puebloId={pueblo.id} />
          </div>
          <Link
            href={`/gestion/asociacion/club/metricas/${pueblo.id}`}
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ver métricas del municipio
          </Link>
        </div>
      </div>

      <ClubRecursos
        puebloId={pueblo.id}
        slug={slug}
        puebloLat={pueblo.lat ?? null}
        puebloLng={pueblo.lng ?? null}
        esAdmin={me.rol === 'ADMIN'}
      />

      <ClubRecursosRurales
        puebloId={pueblo.id}
        puebloNombre={pueblo.nombre}
        puebloLat={pueblo.lat ?? null}
        puebloLng={pueblo.lng ?? null}
        esAdmin={me.rol === 'ADMIN'}
      />
    </GestionPuebloSubpageShell>
  );
}

