import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import RutaForm from '../../RutaForm.client';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold text-red-600">Ruta no encontrada</h1>
      </main>
    );
  }

  return <RutaForm rutaId={parseInt(id, 10)} initialData={ruta} />;
}
