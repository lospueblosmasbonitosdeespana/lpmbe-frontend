import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';

export default async function TiendaAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion"
          className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-900"
        >
          ← Volver
        </Link>
        <h1 className="text-3xl font-bold">Gestión · Tienda</h1>
        <p className="mt-2 text-gray-600">
          Gestión de productos, pedidos y descuentos.
        </p>
      </div>

      <div className="space-y-4">
        <Link
          href="/gestion/asociacion/tienda/productos"
          className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
        >
          <h2 className="text-xl font-semibold">Productos</h2>
          <p className="mt-2 text-sm text-gray-600">
            Crear, editar y gestionar el catálogo de productos
          </p>
        </Link>

        <Link
          href="/gestion/asociacion/tienda/destacados"
          className="block rounded-lg border border-amber-200 bg-amber-50 p-6 transition-shadow hover:shadow-lg"
        >
          <h2 className="text-xl font-semibold">⭐ Productos Destacados</h2>
          <p className="mt-2 text-sm text-gray-600">
            Gestionar los banners grandes de la tienda (máximo 2 productos destacados)
          </p>
        </Link>

        <Link
          href="/gestion/asociacion/tienda/promocion-global"
          className="block rounded-lg border border-blue-200 bg-blue-50 p-6 transition-shadow hover:shadow-lg"
        >
          <h2 className="text-xl font-semibold">🔥 Promoción Global</h2>
          <p className="mt-2 text-sm text-gray-600">
            Gestionar promoción global que se aplica a todos los productos sin descuento propio
          </p>
        </Link>

        <Link
          href="/gestion/asociacion/tienda/pedidos"
          className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
        >
          <h2 className="text-xl font-semibold">Pedidos</h2>
          <p className="mt-2 text-sm text-gray-600">
            Ver y gestionar pedidos realizados
          </p>
        </Link>

        <Link
          href="/gestion/asociacion/tienda/cupones"
          className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
        >
          <h2 className="text-xl font-semibold">Cupones</h2>
          <p className="mt-2 text-sm text-gray-600">
            Gestionar cupones y descuentos
          </p>
        </Link>
      </div>
    </main>
  );
}
