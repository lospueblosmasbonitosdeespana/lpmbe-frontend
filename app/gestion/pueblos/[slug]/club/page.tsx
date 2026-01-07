import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ClubRecursos from './ClubRecursos.client';
import MetricasResumen from './MetricasResumen.client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ClubGestionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  // Si es ALCALDE, verificamos que el pueblo está en su lista.
  if (me.rol === 'ALCALDE') {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect('/gestion/mis-pueblos');
  }

  // Cargar pueblo real
  const pueblo = await getPuebloBySlug(slug);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Club de Amigos - Recursos turísticos</h1>
      <p className="mt-2 text-sm text-gray-600">
        Pueblo: <strong>{pueblo.nombre}</strong> (ID: {pueblo.id})
      </p>

      {/* Bloque de acceso a métricas */}
      <div className="mt-4 mb-4 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Métricas del pueblo (todos los recursos)</div>
            <MetricasResumen puebloId={pueblo.id} />
          </div>
          <Link
            href={`/gestion/asociacion/club/metricas/${pueblo.id}`}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Ver métricas del pueblo
          </Link>
        </div>
      </div>

      <ClubRecursos puebloId={pueblo.id} slug={slug} />

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href={`/gestion/pueblos/${slug}`}>
          ← Volver a gestión del pueblo
        </Link>
      </div>
    </main>
  );
}

