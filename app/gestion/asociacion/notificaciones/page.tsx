import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import NotificacionesList from './NotificacionesList.client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NotificacionesPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <>
      <NotificacionesList />
      <div className="mx-auto max-w-4xl px-6 pb-8">
        <div className="mt-8 text-sm">
          <Link
            className="text-muted-foreground hover:text-foreground hover:underline"
            href="/gestion/asociacion"
          >
            ← Volver a Gestión Asociación
          </Link>
        </div>
      </div>
    </>
  );
}
