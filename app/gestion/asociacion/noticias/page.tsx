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
    <>
      <NoticiasList />
      <div className="mx-auto max-w-4xl px-6 pb-8">
        <div className="mt-8 text-sm">
          <a className="hover:underline" href="/gestion/asociacion">
            ← Volver
          </a>
        </div>
      </div>
    </>
  );
}

