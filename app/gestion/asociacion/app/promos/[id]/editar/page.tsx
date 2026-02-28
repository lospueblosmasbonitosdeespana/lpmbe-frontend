import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import AppPromoForm from '../../AppPromoForm.client';
import type { AppPromoItem } from '../../AppPromosList.client';

export const dynamic = 'force-dynamic';

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
    <main>
      <div className="mx-auto max-w-2xl px-6 pt-6 pb-2">
        <Link className="text-sm text-muted-foreground hover:underline" href="/gestion/asociacion/app/promos">
          ← Volver a Pop-ups
        </Link>
      </div>
      <AppPromoForm id={numId} initialData={promo} />
    </main>
  );
}
