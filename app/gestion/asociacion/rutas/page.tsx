import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import RutasList from './RutasList.client';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

export default async function RutasGestionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  return <RutasList />;
}
