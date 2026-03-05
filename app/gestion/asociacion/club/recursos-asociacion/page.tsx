import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import RecursosAsociacionClient from './RecursosAsociacionClient';

export const dynamic = 'force-dynamic';

export default async function RecursosAsociacionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Recursos turísticos de la asociación</h1>
        <p className="mt-1 text-sm text-gray-500">
          Recursos del Club con ámbito asociación (no vinculados a un pueblo concreto). Aquí puedes ver el listado completo.
        </p>
      </div>

      <RecursosAsociacionClient />

      <div className="mt-8 text-sm">
        <Link className="text-gray-500 hover:underline" href="/gestion/asociacion/club">
          ← Volver al Club de Amigos
        </Link>
      </div>
    </main>
  );
}
