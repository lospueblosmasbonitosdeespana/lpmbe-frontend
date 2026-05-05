import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import { GestionPuebloSubpageShell } from '../../_components/GestionPuebloSubpageShell';
import { HeroIconUsers } from '../../_components/gestion-pueblo-hero-icons';
import ValidadorDesktopClient from './ValidadorDesktopClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

export default async function ValidadorDesktopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN' && me.rol !== 'COLABORADOR') {
    redirect('/cuenta');
  }

  // ALCALDE: debe ser alcalde de este pueblo.
  // ADMIN: siempre.
  // COLABORADOR: dejamos pasar; el backend filtra solo los recursos para los
  //   que tiene UserRecurso activo en este pueblo. Si está vacío se ve mensaje.
  if (me.rol === 'ALCALDE') {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect('/gestion/mis-pueblos');
  }

  const pueblo = await getPuebloBySlug(slug);

  return (
    <GestionPuebloSubpageShell
      slug={slug}
      title="Validador de QR del Club"
      subtitle={
        <>
          Escanea con pistola lectora o cámara · {' '}
          <span className="font-semibold text-white/95">{pueblo.nombre}</span>
        </>
      }
      heroIcon={<HeroIconUsers />}
    >
      <ValidadorDesktopClient
        puebloId={pueblo.id}
        puebloNombre={pueblo.nombre}
        puebloSlug={slug}
      />
    </GestionPuebloSubpageShell>
  );
}
