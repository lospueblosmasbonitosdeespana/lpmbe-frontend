import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import NegociosIndexClient from './NegociosIndexClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default async function NegociosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/mi-cuenta');

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Negocios</h1>
        <p className="mt-1 text-sm text-gray-500">
          Hoteles, restaurantes, casas rurales, comercios y tiendas de los pueblos que participan
          en el Club de Amigos. Selecciona un pueblo para ver y gestionar sus negocios.
        </p>
      </div>

      <NegociosIndexClient />

      <div className="mt-8 text-sm">
        <Link className="text-gray-500 hover:underline" href="/gestion/asociacion">
          &larr; Volver a Asociaci&oacute;n
        </Link>
      </div>
    </main>
  );
}
