import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import NotificacionesList from './NotificacionesList.client';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

export default async function NotificacionesPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return <NotificacionesList />;
}
