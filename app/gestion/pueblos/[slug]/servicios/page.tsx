import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ServiciosPuebloClient from './ServiciosPuebloClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ServiciosPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  if (me.rol === 'ALCALDE') {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect('/gestion/mis-pueblos');
  }

  let pueblo: { id: number; nombre: string; lat?: number | null; lng?: number | null } | null = null;
  try {
    const raw = await getPuebloBySlug(slug);
    if (raw?.id) {
      pueblo = { id: raw.id, nombre: raw.nombre ?? slug, lat: raw.lat ?? null, lng: raw.lng ?? null };
    }
  } catch {
    // Si falla, el cliente mostrará error al cargar
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-4">
        <Link
          href={`/gestion/pueblos/${slug}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a gestión del pueblo
        </Link>
      </div>

      <h1 className="text-2xl font-semibold">Puntos de interés del visitante</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pueblo: <strong>{pueblo?.nombre ?? slug}</strong>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Añade puntos de servicio para los visitantes: lavabos, parking, oficinas de turismo, pipicán, áreas de caravanas, etc.
        Los visitantes verán estos puntos en el mapa de la página del pueblo.
      </p>

      {!pueblo?.id ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          No se pudo obtener el ID del pueblo. Inténtalo de nuevo más tarde.
        </div>
      ) : (
        <div className="mt-6">
          <ServiciosPuebloClient
            puebloId={pueblo.id}
            puebloNombre={pueblo.nombre}
            puebloLat={pueblo.lat}
            puebloLng={pueblo.lng}
          />
        </div>
      )}
    </main>
  );
}
