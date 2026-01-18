import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import NuevoContenidoClient from './NuevoContenidoClient';

export default async function NuevoContenidoPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return <NuevoContenidoClient />;
}
