import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import DocumentosCompartidosClient from './DocumentosCompartidosClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DocumentosCompartidosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  return <DocumentosCompartidosClient />;
}
