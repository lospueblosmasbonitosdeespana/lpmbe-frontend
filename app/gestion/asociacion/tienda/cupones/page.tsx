import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import CuponesAdminClient from './CuponesAdminClient';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconCart } from '../../_components/asociacion-hero-icons';

const TIENDA_BACK = '/gestion/asociacion/tienda';
const TIENDA_BACK_LABEL = 'Volver a Tienda';

export default async function CuponesAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Cupones"
      subtitle="Códigos de descuento y campañas de la tienda"
      heroIcon={<AsociacionHeroIconCart />}
      maxWidthClass="max-w-7xl"
      backHref={TIENDA_BACK}
      backLabel={TIENDA_BACK_LABEL}
    >
      <CuponesAdminClient embeddedInShell />
    </GestionAsociacionSubpageShell>
  );
}
