import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import EventosList from './EventosList.client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EventosGlobalesPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <>
      <EventosList />
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

