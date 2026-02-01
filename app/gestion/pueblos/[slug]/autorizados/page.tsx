import { getMeServer } from '@/lib/me';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import AutorizadosClient from './AutorizadosClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AutorizadosPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await getMeServer();

  // Solo ADMIN puede acceder a esta página
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/gestion');

  // Resolver pueblo
  let puebloNombre = slug;
  let puebloId: number | null = null;
  try {
    const pueblo = await getPuebloBySlug(slug);
    puebloNombre = pueblo.nombre ?? slug;
    puebloId = pueblo.id;
  } catch (e) {
    // Si falla, mostrar error
  }

  if (!puebloId) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold text-red-600">Pueblo no encontrado</h1>
        <p className="mt-2 text-sm text-gray-600">
          No se pudo encontrar el pueblo con slug: {slug}
        </p>
        <Link href="/gestion" className="mt-4 inline-block text-sm hover:underline">
          ← Volver a gestión
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link
          href={`/gestion/pueblos/${slug}`}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Volver a {puebloNombre}
        </Link>
      </div>

      <h1 className="text-2xl font-semibold">Autorizados</h1>
      <p className="mt-2 text-sm text-gray-600">
        Gestiona los usuarios que pueden administrar el pueblo{' '}
        <strong>{puebloNombre}</strong>
      </p>

      <div className="mt-6">
        <AutorizadosClient
          puebloSlug={slug}
          puebloId={puebloId}
          puebloNombre={puebloNombre}
        />
      </div>
    </main>
  );
}
