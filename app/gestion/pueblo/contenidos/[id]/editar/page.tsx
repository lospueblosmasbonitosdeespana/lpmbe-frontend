import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { redirect } from 'next/navigation';
import EditarContenidoClient from '../../../../asociacion/contenidos/[id]/editar/EditarContenidoClient';

export default async function EditarContenidoPuebloPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  const { id } = await params;

  // Reutilizar el componente de edición (el backend valida puebloId y permisos)
  // No necesitamos validar misPueblos aquí porque el backend lo valida por contenidoId
  return <EditarContenidoClient id={id} />;
}
