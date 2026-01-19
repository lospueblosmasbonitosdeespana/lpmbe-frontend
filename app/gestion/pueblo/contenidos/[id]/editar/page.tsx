import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { redirect } from 'next/navigation';
import EditarContenidoPuebloClient from './EditarContenidoPuebloClient';

export default async function EditarContenidoPuebloPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  const { id } = await params;

  // Usar el componente de edición específico de PUEBLO
  return <EditarContenidoPuebloClient id={id} />;
}
