import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PuntosPueblosClient from './PuntosPueblosClient';

export default async function PuntosPueblosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/gestion/asociacion');

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Puntos por pueblo
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Puntos que recibe un usuario al visitar cada pueblo. Los cambios se reflejan en la app y la web.
        </p>
        <Link
          href="/gestion/asociacion/datos"
          className="mt-2 inline-block text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Volver a Datos
        </Link>
      </div>

      <PuntosPueblosClient />
    </main>
  );
}
