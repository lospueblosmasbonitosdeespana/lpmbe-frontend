import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import ClubAdminClient from './ClubAdminClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default async function GestionAsociacionClubPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Club de Amigos — Administración</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona las inscripciones, precios y estadísticas del Club de Amigos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/gestion/asociacion/club/recursos-pueblos"
            className="inline-flex items-center rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-muted/30"
          >
            Recursos turísticos pueblos
          </Link>
          <Link
            href="/gestion/asociacion/club/recursos-asociacion"
            className="inline-flex items-center rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-muted/30"
          >
            Recursos turísticos asociación
          </Link>
          <Link href="/gestion/asociacion/club/metricas" className="text-sm text-primary hover:underline">
            Métricas de validaciones →
          </Link>
        </div>
      </div>

      <ClubAdminClient />

      <div className="mt-8 text-sm">
        <Link className="hover:underline text-muted-foreground" href="/gestion/asociacion">← Volver a Asociación</Link>
      </div>
    </main>
  );
}
