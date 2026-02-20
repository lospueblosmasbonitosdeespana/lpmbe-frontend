import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import RecursosAsociacionClient from './RecursosAsociacionClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RecursosTuristicosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/mi-cuenta');

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">
        Recursos turísticos de la Asociación
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Castillos, monasterios, museos y otros recursos no vinculados a un
        pueblo concreto.
      </p>

      <RecursosAsociacionClient />

      <div className="mt-10 text-sm">
        <Link
          className="text-muted-foreground hover:text-foreground hover:underline"
          href="/gestion/asociacion"
        >
          ← Volver a gestión asociación
        </Link>
      </div>
    </main>
  );
}
