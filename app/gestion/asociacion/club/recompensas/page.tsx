import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import RecompensasAdminClient from './RecompensasAdminClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default async function RecompensasAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/gestion/asociacion/club');

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Premios y recompensas
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Catálogo de canjes que los socios pueden adquirir con sus puntos del Club.
          Define puntos, stock y caducidad. Si necesitas reembolsar un canje, hazlo
          desde la pestaña <strong>Canjes recientes</strong> y los puntos vuelven al
          socio automáticamente.
        </p>
        <Link
          href="/gestion/asociacion/club"
          className="mt-3 inline-block text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Volver a Club, negocio y app
        </Link>
      </div>

      <RecompensasAdminClient />
    </main>
  );
}
