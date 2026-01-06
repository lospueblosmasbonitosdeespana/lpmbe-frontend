import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ClubRecursos from './ClubRecursos.client';

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

      <ClubRecursos puebloId={pueblo.id} slug={slug} />

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href={`/gestion/pueblos/${slug}`}>
          ← Volver a gestión del pueblo
        </Link>
      </div>
    </main>
  );
}

