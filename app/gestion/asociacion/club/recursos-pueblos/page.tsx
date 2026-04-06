import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import RecursosPueblosClient from './RecursosPueblosClient';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconMap } from '../../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const BACK = '/gestion/asociacion/club';
const BACK_LABEL = 'Volver al Club de amigos';

export default async function RecursosPueblosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Recursos turísticos por pueblo"
      subtitle="Listado de pueblos y recursos turísticos del Club en cada uno · Asociación LPMBE"
      heroIcon={<AsociacionHeroIconMap />}
      maxWidthClass="max-w-5xl"
      backHref={BACK}
      backLabel={BACK_LABEL}
    >
      <RecursosPueblosClient />
    </GestionAsociacionSubpageShell>
  );
}
