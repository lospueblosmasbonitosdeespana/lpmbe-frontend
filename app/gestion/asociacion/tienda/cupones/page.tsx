import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import CuponesAdminClient from './CuponesAdminClient';

export default async function CuponesAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return <CuponesAdminClient />;
}
