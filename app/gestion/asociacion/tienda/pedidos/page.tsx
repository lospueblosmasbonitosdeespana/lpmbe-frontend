import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import PedidosAdminClient from './PedidosAdminClient';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconClipboard } from '../../_components/asociacion-hero-icons';

const TIENDA_BACK = '/gestion/asociacion/tienda';
const TIENDA_BACK_LABEL = 'Volver a Tienda';

export default async function PedidosAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Pedidos"
      subtitle="Estados, envíos SendCloud y seguimiento de la tienda"
      heroIcon={<AsociacionHeroIconClipboard />}
      maxWidthClass="max-w-7xl"
      backHref={TIENDA_BACK}
      backLabel={TIENDA_BACK_LABEL}
    >
      <PedidosAdminClient embeddedInShell />
    </GestionAsociacionSubpageShell>
  );
}
