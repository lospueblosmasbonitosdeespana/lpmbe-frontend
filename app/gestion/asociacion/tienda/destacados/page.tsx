import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';

export default async function DestacadosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/gestion/asociacion/tienda"
        className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-900"
      >
        ← Volver a Tienda
      </Link>
      <h1 className="text-3xl font-bold">Banners destacados</h1>
      <p className="mt-2 text-gray-600">
        Gestión de banners destacados en la tienda.
      </p>
    </main>
  );
}
