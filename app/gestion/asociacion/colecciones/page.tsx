import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import ColeccionesAdmin from './ColeccionesAdmin.client';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

export default async function ColeccionesAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return <ColeccionesAdmin />;
}
