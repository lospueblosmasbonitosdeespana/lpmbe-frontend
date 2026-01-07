import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';

export default async function GestionAsociacionClubPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Gestión · Asociación · Club de amigos</h1>

      <div className="mt-8 rounded-md border p-4">
        <div className="font-medium">Accesos</div>
        <ul className="mt-3 list-disc pl-5 text-sm">
          <li>
            <Link className="hover:underline" href="/gestion/asociacion/club/metricas">
              Métricas (globales)
            </Link>
          </li>
        </ul>
      </div>

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href="/gestion/asociacion">← Volver a Asociación</Link>
      </div>
    </main>
  );
}


