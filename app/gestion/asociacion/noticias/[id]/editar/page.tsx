import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import EditarNoticiaClient from './EditarNoticiaClient';

export default async function EditarNoticiaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  const { id } = await params;

  return <EditarNoticiaClient id={id} />;
}
