import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import PedidosAdminClient from './PedidosAdminClient';

export default async function PedidosAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return <PedidosAdminClient />;
}
