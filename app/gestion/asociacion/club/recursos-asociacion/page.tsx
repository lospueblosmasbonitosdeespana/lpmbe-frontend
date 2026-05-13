import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import RecursosAsociacionClient from './RecursosAsociacionClient';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconCastle } from '../../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const BACK = '/gestion/asociacion/club';
const BACK_LABEL = 'Volver al Club';

export default async function RecursosAsociacionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Recursos Naturales (asociación)"
      subtitle="Cascadas, parajes, miradores, hoces, sendas… ámbito nacional · gestionados por la asociación"
      heroIcon={<AsociacionHeroIconCastle />}
      maxWidthClass="max-w-5xl"
      backHref={BACK}
      backLabel={BACK_LABEL}
    >
      <RecursosAsociacionClient />
    </GestionAsociacionSubpageShell>
  );
}
