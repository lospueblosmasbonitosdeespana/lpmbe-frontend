import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import VentasAdminClient from './VentasAdminClient';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconChart } from '../../_components/asociacion-hero-icons';

const TIENDA_BACK = '/gestion/asociacion/tienda';
const TIENDA_BACK_LABEL = 'Volver a Tienda';

export default async function VentasAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Informe de ventas"
      subtitle="Desglose fiscal: base imponible, IVA, portes y totales"
      heroIcon={<AsociacionHeroIconChart />}
      maxWidthClass="max-w-7xl"
      backHref={TIENDA_BACK}
      backLabel={TIENDA_BACK_LABEL}
    >
      <VentasAdminClient embeddedInShell />
    </GestionAsociacionSubpageShell>
  );
}
