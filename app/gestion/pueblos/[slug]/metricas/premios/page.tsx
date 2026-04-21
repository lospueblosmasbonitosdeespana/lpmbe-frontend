import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect, notFound } from 'next/navigation';
import { GestionPuebloSubpageShell } from '../../../_components/GestionPuebloSubpageShell';
import PremiosPuebloDashboard from './PremiosPuebloDashboard';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

export default async function PuebloPremiosPage({
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
      title="10 Premios"
      subtitle={
        <>
          Tu posición en los reconocimientos anuales ·{' '}
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
            d="M8 21h8M12 17v4M6 3h12v4a6 6 0 01-12 0V3zm0 0H3v2a3 3 0 003 3m12-5h3v2a3 3 0 01-3 3"
          />
        </svg>
      }
    >
      <PremiosPuebloDashboard puebloId={puebloId} puebloNombre={puebloNombre} />
    </GestionPuebloSubpageShell>
  );
}
