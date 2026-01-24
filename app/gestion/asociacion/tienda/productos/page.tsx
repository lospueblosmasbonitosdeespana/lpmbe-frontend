import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import ProductosAdminClient from './ProductosAdminClient';

export default async function ProductosAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return <ProductosAdminClient />;
}
