import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import PuebloMetricasDashboard from './PuebloMetricasDashboard';
import { GestionPuebloSubpageShell } from '../../_components/GestionPuebloSubpageShell';
import { HeroIconChart } from '../../_components/gestion-pueblo-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

export default async function PuebloMetricasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (!['ADMIN', 'EDITOR', 'ALCALDE'].includes(me.rol)) redirect('/cuenta');

  const { slug } = await params;

  if (me.rol === 'ALCALDE') {
    const misPueblos = await getMisPueblosServer();
    const tieneAcceso = misPueblos?.some((p) => p.slug === slug);
    if (!tieneAcceso) redirect('/gestion/mis-pueblos');
  }

  let puebloId: number | null = null;
  let puebloNombre = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  try {
    const pueblo = await getPuebloBySlug(slug);
    puebloId = pueblo?.id ?? null;
    if (pueblo?.nombre) puebloNombre = pueblo.nombre;
  } catch {
    puebloId = null;
  }

  return (
    <GestionPuebloSubpageShell
      slug={slug}
      title="Métricas del pueblo"
      subtitle={
        <>
          Visitas, valoraciones y analítica web ·{' '}
          <span className="font-semibold text-white/95">{puebloNombre}</span>
        </>
      }
      heroIcon={<HeroIconChart />}
      maxWidthClass="max-w-7xl"
    >
      <PuebloMetricasDashboard slug={slug} puebloId={puebloId} />
    </GestionPuebloSubpageShell>
  );
}
