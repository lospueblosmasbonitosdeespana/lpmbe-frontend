import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import AppPromoForm from '../../AppPromoForm.client';
import type { AppPromoItem } from '../../AppPromosList.client';
import { GestionAsociacionSubpageShell } from '../../../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconSmartphone } from '../../../../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const PROMOS_BACK = '/gestion/asociacion/app/promos';
const PROMOS_BACK_LABEL = 'Volver a Pop-ups';

async function getPromo(id: number): Promise<AppPromoItem | null> {
  const { getApiUrl } = await import('@/lib/api');
  const { getToken } = await import('@/lib/auth');
  const token = await getToken();
  if (!token) return null;

  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/admin/app-promos/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function EditarAppPromoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) redirect('/gestion/asociacion/app/promos');

  const promo = await getPromo(numId);
  if (!promo) redirect('/gestion/asociacion/app/promos');

  return (
    <GestionAsociacionSubpageShell
      title="Editar promo"
      subtitle={promo.title}
      heroIcon={<AsociacionHeroIconSmartphone />}
      maxWidthClass="max-w-3xl"
      backHref={PROMOS_BACK}
      backLabel={PROMOS_BACK_LABEL}
    >
      <AppPromoForm id={numId} initialData={promo} embeddedInShell />
    </GestionAsociacionSubpageShell>
  );
}
