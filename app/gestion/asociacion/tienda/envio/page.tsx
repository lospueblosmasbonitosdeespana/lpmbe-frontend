import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import EnvioAdminClient from './EnvioAdminClient';
import { GestionAsociacionSubpageShell } from '../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconCart } from '../../_components/asociacion-hero-icons';

const TIENDA_BACK = '/gestion/asociacion/tienda';
const TIENDA_BACK_LABEL = 'Volver a Tienda';

export default async function EnvioAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Envío"
      subtitle="Zonas, tarifas por peso y umbral de envío gratis (SendCloud)"
      heroIcon={<AsociacionHeroIconCart />}
      maxWidthClass="max-w-5xl"
      backHref={TIENDA_BACK}
      backLabel={TIENDA_BACK_LABEL}
    >
      <EnvioAdminClient />
    </GestionAsociacionSubpageShell>
  );
}
