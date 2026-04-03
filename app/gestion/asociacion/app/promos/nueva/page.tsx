import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import AppPromoForm from '../AppPromoForm.client';
import { GestionAsociacionSubpageShell } from '../../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconSmartphone } from '../../../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const PROMOS_BACK = '/gestion/asociacion/app/promos';
const PROMOS_BACK_LABEL = 'Volver a Pop-ups';

export default async function NuevaAppPromoPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Nueva promo"
      subtitle="Pop-up o oferta para la app móvil"
      heroIcon={<AsociacionHeroIconSmartphone />}
      maxWidthClass="max-w-3xl"
      backHref={PROMOS_BACK}
      backLabel={PROMOS_BACK_LABEL}
    >
      <AppPromoForm embeddedInShell />
    </GestionAsociacionSubpageShell>
  );
}
