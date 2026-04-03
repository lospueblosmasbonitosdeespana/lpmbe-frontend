import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import AppPromosList from './AppPromosList.client';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconSmartphone } from '../../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const APP_BACK = '/gestion/asociacion/app';
const APP_BACK_LABEL = 'Volver a App';

export default async function AppPromosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Pop-ups y ofertas (app)"
      subtitle="Los usuarios verán el pop-up activo según las reglas que definas"
      heroIcon={<AsociacionHeroIconSmartphone />}
      maxWidthClass="max-w-4xl"
      backHref={APP_BACK}
      backLabel={APP_BACK_LABEL}
    >
      <AppPromosList embeddedInShell />
    </GestionAsociacionSubpageShell>
  );
}
