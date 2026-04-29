import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ClubRecursos from './ClubRecursos.client';
import ClubRecursosRurales from './ClubRecursosRurales.client';
import GamificacionResumen from './GamificacionResumen.client';
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
      title="Club de Amigos"
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

      <GamificacionResumen />

      <ClubRecursos puebloId={pueblo.id} slug={slug} puebloLat={pueblo.lat ?? null} puebloLng={pueblo.lng ?? null} />

      <ClubRecursosRurales
        puebloId={pueblo.id}
        puebloNombre={pueblo.nombre}
        puebloLat={pueblo.lat ?? null}
        puebloLng={pueblo.lng ?? null}
      />
    </GestionPuebloSubpageShell>
  );
}

