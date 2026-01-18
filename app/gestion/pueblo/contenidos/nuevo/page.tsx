import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { redirect } from 'next/navigation';
import NuevoContenidoPuebloClient from './NuevoContenidoPuebloClient';

export default async function NuevoContenidoPuebloPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  const misPueblos = await getMisPueblosServer();
  if (misPueblos.length === 0) {
    // Si falla getMisPueblos, redirigir a mis-pueblos en vez de /gestion
    redirect('/gestion/mis-pueblos');
  }

  const pueblo = misPueblos[0];

  return <NuevoContenidoPuebloClient puebloId={pueblo.id} puebloNombre={pueblo.nombre} />;
}
