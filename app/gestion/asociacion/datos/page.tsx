import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';

export default async function DatosAdminPage() {
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
        <h1 className="text-3xl font-bold">Datos</h1>
        <p className="mt-2 text-gray-600">
          Métricas, clientes y newsletter. Visión global para administradores.
        </p>
      </div>

      <div className="space-y-4">
        <Link
          href="/gestion/asociacion/datos/metricas"
          className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
        >
          <h2 className="text-xl font-semibold">📊 Métricas</h2>
          <p className="mt-2 text-sm text-gray-600">
            Dashboard con métricas globales: Club, tienda, usuarios y actividad
          </p>
        </Link>

        <Link
          href="/gestion/asociacion/datos/usuarios"
          className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
        >
          <h2 className="text-xl font-semibold">👤 Usuarios</h2>
          <p className="mt-2 text-sm text-gray-600">
            Gestión completa: ver, editar, cambiar roles y pueblos visitados
          </p>
        </Link>

        <Link
          href="/gestion/asociacion/datos/clientes"
          className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
        >
          <h2 className="text-xl font-semibold">👥 Clientes</h2>
          <p className="mt-2 text-sm text-gray-600">
            Listado de clientes de la tienda con historial de pedidos
          </p>
        </Link>

        <Link
          href="/gestion/asociacion/datos/newsletter"
          className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
        >
          <h2 className="text-xl font-semibold">📧 Newsletter</h2>
          <p className="mt-2 text-sm text-gray-600">
            Suscriptores y gestión de la newsletter
          </p>
        </Link>

        <Link
          href="/gestion/asociacion/datos/pueblos"
          className="block rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
        >
          <h2 className="text-xl font-semibold">🏘️ Pueblos</h2>
          <p className="mt-2 text-sm text-gray-600">
            Registro de todos los movimientos: quién ha tocado qué y cuándo
          </p>
        </Link>
      </div>
    </main>
  );
}
