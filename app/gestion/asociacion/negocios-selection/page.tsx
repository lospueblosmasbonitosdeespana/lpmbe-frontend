import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import NegociosPuebloClient from '../negocios/[slug]/NegociosPuebloClient';
import { GestionAsociacionSubpageShell } from '../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconStore } from '../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const BACK = '/gestion/asociacion';
const BACK_LABEL = 'Volver a Asociación';

export default async function NegociosSelectionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <GestionAsociacionSubpageShell
      title="Negocios Club LPMBE Selection"
      subtitle="Establecimientos del nivel Selection — pueden estar en cualquier lugar rural de España, dentro o fuera de la red"
      heroIcon={<AsociacionHeroIconStore />}
      maxWidthClass="max-w-5xl"
      backHref={BACK}
      backLabel={BACK_LABEL}
    >
      <NegociosPuebloClient puebloSlug="selection-activos" embeddedInShell />
    </GestionAsociacionSubpageShell>
  );
}
