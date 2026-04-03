import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import RutaForm from '../../RutaForm.client';
import { headers } from 'next/headers';
import { GestionAsociacionSubpageShell } from '../../../_components/GestionAsociacionSubpageShell';
import { AsociacionHeroIconMap } from '../../../_components/asociacion-hero-icons';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

const RUTAS_BACK = '/gestion/asociacion/rutas';
const RUTAS_BACK_LABEL = 'Volver a Rutas';

async function fetchRuta(rutaId: string) {
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(`${baseUrl}/api/gestion/asociacion/rutas/${rutaId}`, {
    cache: 'no-store',
    headers: { cookie: h.get('cookie') ?? '' },
  });

  if (!res.ok) return null;
  return await res.json().catch(() => null);
}

export default async function EditarRutaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  const { id } = await params;
  const ruta = await fetchRuta(id);

  if (!ruta) {
    return (
      <GestionAsociacionSubpageShell
        title="Ruta no encontrada"
        subtitle="No existe o no tienes acceso"
        heroIcon={<AsociacionHeroIconMap />}
        maxWidthClass="max-w-6xl"
        backHref={RUTAS_BACK}
        backLabel={RUTAS_BACK_LABEL}
      >
        <p className="text-destructive">No se encontró la ruta solicitada.</p>
      </GestionAsociacionSubpageShell>
    );
  }

  const titulo = typeof ruta.titulo === 'string' ? ruta.titulo : 'Ruta';

  return (
    <GestionAsociacionSubpageShell
      title="Editar ruta"
      subtitle={titulo}
      heroIcon={<AsociacionHeroIconMap />}
      maxWidthClass="max-w-6xl"
      backHref={RUTAS_BACK}
      backLabel={RUTAS_BACK_LABEL}
    >
      <RutaForm rutaId={parseInt(id, 10)} initialData={ruta} />
    </GestionAsociacionSubpageShell>
  );
}
