import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';

export default async function ProductosAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion/tienda"
          className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-900"
        >
          ← Volver a Tienda
        </Link>
        <h1 className="text-3xl font-bold">Productos</h1>
        <p className="mt-2 text-gray-600">
          Gestión de productos de la tienda
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <p className="text-gray-600">
          Aquí se gestionarán productos (crear/editar/precio/stock/foto).
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Funcionalidad próximamente disponible.
        </p>
      </div>
    </main>
  );
}
