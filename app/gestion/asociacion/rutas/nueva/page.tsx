import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import RutaForm from '../RutaForm.client';

export default async function NuevaRutaPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return <RutaForm />;
}
