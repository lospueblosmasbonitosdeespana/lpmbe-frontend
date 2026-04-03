import { redirect } from 'next/navigation';
import { getMeServer } from '@/lib/me';
import CampaignDetailClient from '@/app/_components/CampaignDetailClient';
import { GestionAsociacionSubpageShell } from '../../../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconChart } from '../../../../_components/asociacion-hero-icons';

const NEWSLETTER_BACK = '/gestion/asociacion/notas-prensa-newsletter/newsletter';
const NEWSLETTER_BACK_LABEL = 'Volver a Newsletter';

export default async function NewsletterCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  const { id } = await params;
  const campaignId = parseInt(id, 10);
  if (Number.isNaN(campaignId)) redirect(NEWSLETTER_BACK);

  return (
    <GestionAsociacionSubpageShell
      title="Métricas de campaña"
      subtitle="Newsletter · envíos y destinatarios"
      heroIcon={<AsociacionHeroIconChart />}
      maxWidthClass="max-w-4xl"
      backHref={NEWSLETTER_BACK}
      backLabel={NEWSLETTER_BACK_LABEL}
    >
      <CampaignDetailClient
        campaignId={campaignId}
        backHref={NEWSLETTER_BACK}
        kind="newsletter"
        embeddedInShell
      />
    </GestionAsociacionSubpageShell>
  );
}
