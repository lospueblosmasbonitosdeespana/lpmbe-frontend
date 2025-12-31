import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import NoticiasList from './NoticiasList.client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NoticiasGlobalesPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Noticias globales</h1>
          <p className="mt-1 text-sm text-gray-600">Asociación · Nacional</p>
        </div>

        <Link
          className="rounded-md border px-3 py-2 text-sm hover:underline"
          href="/gestion/asociacion/noticias/nueva"
        >
          + Nueva noticia
        </Link>
      </div>

      <NoticiasList />

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href="/gestion/asociacion">
          ← Volver
        </Link>
      </div>
    </main>
  );
}

