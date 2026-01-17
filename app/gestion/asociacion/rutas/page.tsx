import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import RutasList from './RutasList.client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RutasGestionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <>
      <RutasList />
      <div className="mx-auto max-w-4xl px-6 pb-8">
        <div className="mt-8 text-sm">
          <Link className="hover:underline" href="/gestion/asociacion">
            ← Volver
          </Link>
        </div>
      </div>
    </>
  );
}
