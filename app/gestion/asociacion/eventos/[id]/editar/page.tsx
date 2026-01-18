import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import EditarEventoClient from './EditarEventoClient';

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  const { id } = await params;

  return <EditarEventoClient id={id} />;
}
