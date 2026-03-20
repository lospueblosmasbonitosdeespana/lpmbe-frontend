import { redirect } from 'next/navigation';
import { getToken } from '@/lib/auth';
import CampaignDetailClient from '@/app/_components/CampaignDetailClient';

export default async function NotaPrensaCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await getToken();
  if (!token) redirect('/entrar');

  const { id } = await params;
  const campaignId = parseInt(id, 10);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <CampaignDetailClient
        campaignId={campaignId}
        backHref="/gestion/asociacion/notas-prensa-newsletter/notas-prensa"
        kind="prensa"
      />
    </div>
  );
}
