import { getMeServer } from '@/lib/me';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ColaboradorPuebloClient from './ColaboradorPuebloClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ColaboradorPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await getMeServer();

  if (!me) redirect('/entrar');

  // Solo COLABORADOR, ALCALDE y ADMIN pueden acceder
  if (!['ADMIN', 'ALCALDE', 'COLABORADOR'].includes(me.rol)) {
    redirect('/gestion');
  }

  let puebloNombre = slug;
  let puebloId: number | null = null;
  try {
    const pueblo = await getPuebloBySlug(slug);
    puebloNombre = pueblo.nombre ?? slug;
    puebloId = pueblo.id;
  } catch {
    // ignorar
  }

  if (!puebloId) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold text-red-600">Pueblo no encontrado</h1>
        <Link href="/gestion" className="mt-4 inline-block text-sm hover:underline">
          ← Volver a gestión
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <Link
          href={`/gestion/pueblos/${slug}`}
          className="text-sm text-gray-600 hover:underline"
        >
          ← Volver a {puebloNombre}
        </Link>
      </div>

      <h1 className="text-2xl font-semibold mb-1">Mi recurso en {puebloNombre}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Gestiona la información y consulta las métricas de tu recurso turístico.
      </p>

      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        <ColaboradorPuebloClient puebloSlug={slug} />
      </div>
    </main>
  );
}
