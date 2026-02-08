import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogosAdminClient from './LogosAdminClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LogosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <Link
          href="/gestion/asociacion"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Gestión Asociación
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Logos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Logos reutilizables para rutas, páginas y demás. Sube transparentes, de
          color, etc. y asígnalos donde los necesites.
        </p>
      </div>

      <LogosAdminClient />
    </main>
  );
}
