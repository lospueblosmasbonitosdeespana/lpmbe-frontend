import { redirect } from 'next/navigation';
import { getMeServer } from '@/lib/me';
import Link from 'next/link';
import ColaboradorClient from './ColaboradorClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ColaboradorPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'COLABORADOR' && me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Panel de colaborador</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gestiona la información y consulta las métricas de tus recursos turísticos
            </p>
          </div>
          <Link href="/mi-cuenta" className="rounded-lg border px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            ← Mi cuenta
          </Link>
        </div>
      </header>

      <ColaboradorClient />
    </main>
  );
}
