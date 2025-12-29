import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function EventosGestionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Eventos</h1>
      <p className="mt-2 text-sm text-gray-600">Placeholder.</p>
      <div className="mt-6 text-sm">
        <Link className="hover:underline" href="/gestion">← Volver</Link>
      </div>
    </main>
  );
}

