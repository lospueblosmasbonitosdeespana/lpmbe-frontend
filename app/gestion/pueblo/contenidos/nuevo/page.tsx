import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { redirect } from 'next/navigation';
import NuevoContenidoPuebloClient from './NuevoContenidoPuebloClient';

export default async function NuevoContenidoPuebloPage({
  searchParams,
}: {
  searchParams: Promise<{ puebloId?: string; puebloNombre?: string; tipo?: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  const params = await searchParams;

  // puebloId OBLIGATORIO desde searchParams
  if (!params.puebloId) {
    redirect('/gestion/mis-pueblos');
  }

  const puebloId = Number(params.puebloId);

  // Validar que sea número válido
  if (Number.isNaN(puebloId) || puebloId <= 0) {
    redirect('/gestion/mis-pueblos');
  }

  // Obtener nombre del pueblo
  let puebloNombre = `Pueblo #${puebloId}`; // Fallback con espacio y #

  // Prioridad 1: puebloNombre desde query params
  if (params.puebloNombre) {
    puebloNombre = decodeURIComponent(params.puebloNombre);
  }
  // Prioridad 2: buscar en mis pueblos (alcaldes)
  else if (me.rol === 'ALCALDE') {
    const misPueblos = await getMisPueblosServer();
    const pueblo = misPueblos.find(p => p.id === puebloId);
    if (pueblo) puebloNombre = pueblo.nombre;
  }

  return (
    <NuevoContenidoPuebloClient
      puebloId={puebloId}
      puebloNombre={puebloNombre}
      tipoInicial={params.tipo}
    />
  );
}
