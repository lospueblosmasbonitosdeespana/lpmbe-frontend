import { redirect } from 'next/navigation';
import { getMeServer } from '@/lib/me';
import FotosClient from './FotosClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default async function GestionAsociacionFotosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/mi-cuenta');

  return <FotosClient />;
}
