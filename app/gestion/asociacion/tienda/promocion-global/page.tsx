import { redirect } from 'next/navigation';
import { getMeServer } from '@/lib/me';
import GlobalPromotionClient from './GlobalPromotionClient';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconCart } from '../../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';

const TIENDA_BACK = '/gestion/asociacion/tienda';
const TIENDA_BACK_LABEL = 'Volver a Tienda';

export default async function GlobalPromotionPage() {
  const me = await getMeServer();

  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Promoción global"
      subtitle="Descuentos que se aplican a productos sin descuento propio"
      heroIcon={<AsociacionHeroIconCart />}
      maxWidthClass="max-w-4xl"
      backHref={TIENDA_BACK}
      backLabel={TIENDA_BACK_LABEL}
    >
      <GlobalPromotionClient embeddedInShell />
    </GestionAsociacionSubpageShell>
  );
}
