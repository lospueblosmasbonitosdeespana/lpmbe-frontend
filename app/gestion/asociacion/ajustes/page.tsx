import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import AjustesClient from './AjustesClient';

export const dynamic = 'force-dynamic';

export default async function AjustesPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">Ajustes de marca y logos</h1>
      <p className="mt-1 text-sm text-gray-600">
        Logo del header y footer, nombre del sitio y biblioteca de logos
      </p>

      <AjustesClient />
    </main>
  );
}
