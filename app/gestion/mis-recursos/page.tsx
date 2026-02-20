import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import MisRecursosClient from './MisRecursosClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED_ROLES = ['COLABORADOR', 'ALCALDE', 'ADMIN'];

export default async function MisRecursosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (!ALLOWED_ROLES.includes(me.rol)) redirect('/mi-cuenta');

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Mis recursos</h1>
      <p className="mt-2 text-sm text-gray-600">
        Recursos turísticos asignados para edición
      </p>

      <MisRecursosClient />

      <div className="mt-8 text-sm">
        <Link
          className="text-gray-500 hover:text-gray-700 hover:underline"
          href="/mi-cuenta"
        >
          ← Volver a mi cuenta
        </Link>
      </div>
    </main>
  );
}
