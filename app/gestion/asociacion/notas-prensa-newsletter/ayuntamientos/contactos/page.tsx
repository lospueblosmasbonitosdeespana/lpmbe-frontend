import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import { GestionAsociacionSubpageShell } from '../../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconMegaphone } from '../../../_components/asociacion-hero-icons';
import InstitutionalContactsClient from './InstitutionalContactsClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const BACK = '/gestion/asociacion/notas-prensa-newsletter/ayuntamientos';
const BACK_LABEL = 'Volver a Ayuntamientos';

export default async function Page() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Contactos institucionales"
      subtitle="Alcaldes, concejales, oficinas de turismo y demás personal de ayuntamiento"
      heroIcon={<AsociacionHeroIconMegaphone />}
      maxWidthClass="max-w-7xl"
      backHref={BACK}
      backLabel={BACK_LABEL}
    >
      <InstitutionalContactsClient />
    </GestionAsociacionSubpageShell>
  );
}
