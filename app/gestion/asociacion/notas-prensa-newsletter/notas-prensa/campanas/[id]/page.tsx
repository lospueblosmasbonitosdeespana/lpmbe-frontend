import { redirect } from 'next/navigation';
import { getMeServer } from '@/lib/me';
import CampaignDetailClient from '@/app/_components/CampaignDetailClient';
import { GestionAsociacionSubpageShell } from '../../../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconChart } from '../../../../_components/asociacion-hero-icons';

const NOTAS_PRENSA_BACK = '/gestion/asociacion/notas-prensa-newsletter/notas-prensa';
const NOTAS_PRENSA_BACK_LABEL = 'Volver a Notas de prensa';

export default async function NotaPrensaCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  const { id } = await params;
  const campaignId = parseInt(id, 10);
  if (Number.isNaN(campaignId)) redirect(NOTAS_PRENSA_BACK);

  return (
    <GestionAsociacionSubpageShell
      title="Métricas de campaña"
      subtitle="Nota de prensa · envíos y destinatarios"
      heroIcon={<AsociacionHeroIconChart />}
      maxWidthClass="max-w-4xl"
      backHref={NOTAS_PRENSA_BACK}
      backLabel={NOTAS_PRENSA_BACK_LABEL}
    >
      <CampaignDetailClient
        campaignId={campaignId}
        backHref={NOTAS_PRENSA_BACK}
        kind="prensa"
        embeddedInShell
      />
    </GestionAsociacionSubpageShell>
  );
}
