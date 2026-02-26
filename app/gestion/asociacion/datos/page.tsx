import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ActividadDashboard from './ActividadDashboard';

export default async function DatosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/mi-cuenta');

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Datos · Actividad</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Métricas en tiempo real de la plataforma: usuarios, visitas, valoraciones y gamificación.
        </p>
        <Link
          href="/gestion/asociacion"
          className="mt-2 inline-block text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Volver a Asociación
        </Link>
      </div>

      <ActividadDashboard />
    </main>
  );
}
