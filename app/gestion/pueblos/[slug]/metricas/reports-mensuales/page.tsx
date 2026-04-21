import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect, notFound } from 'next/navigation';
import { GestionPuebloSubpageShell } from '../../../_components/GestionPuebloSubpageShell';
import ReportsMensualesPuebloDashboard from './ReportsMensualesPuebloDashboard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

export default async function PuebloReportsMensualesPage({
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
  if (!puebloId) notFound();

  return (
    <GestionPuebloSubpageShell
      slug={slug}
      title="Reports mensuales"
      subtitle={
        <>
          Resumen automático que recibes el día 1 de cada mes ·{' '}
          <span className="font-semibold text-white/95">{puebloNombre}</span>
        </>
      }
      maxWidthClass="max-w-6xl"
      heroIcon={
        <svg
          className="h-6 w-6 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8l9 6 9-6M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
          />
        </svg>
      }
    >
      <ReportsMensualesPuebloDashboard puebloId={puebloId} puebloNombre={puebloNombre} />
    </GestionPuebloSubpageShell>
  );
}
