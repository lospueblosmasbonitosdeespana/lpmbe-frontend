import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import EnvioAdminClient from './EnvioAdminClient';

export default async function EnvioAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion/tienda"
          className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-900"
        >
          &larr; Volver a Tienda
        </Link>
        <h1 className="text-3xl font-bold">Gestion &middot; Envio</h1>
        <p className="mt-2 text-gray-600">
          Configura zonas de envio, tarifas por peso y el umbral de envio gratuito para SendCloud.
        </p>
      </div>

      <EnvioAdminClient />
    </main>
  );
}
