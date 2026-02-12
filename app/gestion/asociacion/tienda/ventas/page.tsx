import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import VentasAdminClient from './VentasAdminClient';

export default async function VentasAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return <VentasAdminClient />;
}
