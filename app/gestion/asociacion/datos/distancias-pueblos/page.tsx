import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DistanciasPueblosClient from './DistanciasPueblosClient';

export default async function DistanciasPueblosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/gestion/asociacion');

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Distancias por pueblo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Geofence (radio en metros) que la app usa para considerar al socio dentro del pueblo
          y registrar visita GPS. Los cambios afectan a la app móvil inmediatamente.
        </p>
        <Link
          href="/gestion/asociacion/datos"
          className="mt-2 inline-block text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Volver a Datos
        </Link>
      </div>

      <DistanciasPueblosClient />
    </main>
  );
}
