import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import PressContactsManagerClient from './PressContactsManagerClient';
import { GestionAsociacionSubpageShell } from '../../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconMegaphone } from '../../../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const NOTAS_PRENSA_BACK = '/gestion/asociacion/notas-prensa-newsletter/notas-prensa';
const NOTAS_PRENSA_BACK_LABEL = 'Volver a Notas de prensa';

export default async function PressContactsManagerPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Contactos de prensa"
      subtitle="Consulta, edita y elimina contactos de medios"
      heroIcon={<AsociacionHeroIconMegaphone />}
      maxWidthClass="max-w-6xl"
      backHref={NOTAS_PRENSA_BACK}
      backLabel={NOTAS_PRENSA_BACK_LABEL}
    >
      <PressContactsManagerClient />
    </GestionAsociacionSubpageShell>
  );
}
