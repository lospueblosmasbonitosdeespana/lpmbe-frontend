import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { redirect } from 'next/navigation';
import NoticiasList from './NoticiasList.client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NoticiasPuebloPage({
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
    if (!mis.some((p) => p.slug === slug)) redirect('/gestion/mis-pueblos');
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Noticias</h1>
          <p className="mt-1 text-sm text-gray-600">
            Pueblo: <strong>{slug}</strong>
          </p>
        </div>

        <Link
          className="rounded-md border px-3 py-2 text-sm hover:underline"
          href={`/gestion/pueblos/${slug}/noticias/nueva`}
        >
          + Nueva noticia
        </Link>
      </div>

      <NoticiasList puebloSlug={slug} />

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href={`/gestion/pueblos/${slug}`}>
          ← Volver a gestión del pueblo
        </Link>
      </div>
    </main>
  );
}

