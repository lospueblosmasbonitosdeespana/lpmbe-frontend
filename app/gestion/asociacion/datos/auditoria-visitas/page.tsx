import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import AuditoriaVisitasClient from './AuditoriaVisitasClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default async function Page() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return <AuditoriaVisitasClient />;
}
