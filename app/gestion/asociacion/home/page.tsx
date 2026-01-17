import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import { getHomeConfig } from '@/lib/homeApi';
import HomeConfigForm from './HomeConfigForm';

export default async function GestionHomePage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  // Cargar configuración actual
  const config = await getHomeConfig();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Configuración del Home</h1>
      <p className="mt-2 text-sm text-gray-600">
        Personaliza el contenido de la página principal
      </p>

      <div className="mt-8">
        <HomeConfigForm initialConfig={config} />
      </div>

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href="/gestion/asociacion">
          ← Volver a gestión asociación
        </Link>
      </div>
    </main>
  );
}
