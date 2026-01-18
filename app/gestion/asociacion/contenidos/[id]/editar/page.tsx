import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import EditarContenidoClient from './EditarContenidoClient';

export default async function EditarContenidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  const { id } = await params;

  return <EditarContenidoClient id={id} />;
}
