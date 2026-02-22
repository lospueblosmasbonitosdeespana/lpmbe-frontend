import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import ClubAdminClient from './ClubAdminClient';

export const dynamic = 'force-dynamic';

export default async function GestionAsociacionClubPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Club de Amigos — Administración</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona las inscripciones, precios y estadísticas del Club de Amigos.
          </p>
        </div>
        <Link href="/gestion/asociacion/club/metricas" className="text-sm text-primary hover:underline">
          Métricas de validaciones →
        </Link>
      </div>

      <ClubAdminClient />

      <div className="mt-8 text-sm">
        <Link className="hover:underline text-gray-500" href="/gestion/asociacion">← Volver a Asociación</Link>
      </div>
    </main>
  );
}
