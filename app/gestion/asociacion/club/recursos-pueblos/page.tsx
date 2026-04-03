import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import RecursosPueblosClient from './RecursosPueblosClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default async function RecursosPueblosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Recursos turísticos por pueblo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vista de todos los pueblos con el número de recursos del Club creados en cada uno. Haz clic en un pueblo para ver y gestionar sus recursos.
        </p>
      </div>

      <RecursosPueblosClient />

      <div className="mt-8 text-sm">
        <Link className="text-muted-foreground hover:underline" href="/gestion/asociacion/club">
          ← Volver al Club de Amigos
        </Link>
      </div>
    </main>
  );
}
