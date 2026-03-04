import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import DatosTabs from './DatosTabs';

export default async function DatosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/mi-cuenta');

  const { tab } = await searchParams;
  const activeTab = ['usuarios', 'pueblos', 'web', 'app', 'interno', 'puntos'].includes(tab ?? '')
    ? (tab as 'usuarios' | 'pueblos' | 'web' | 'app' | 'interno' | 'puntos')
    : 'usuarios';

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Datos · Métricas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Panel de métricas de la plataforma: usuarios, pueblos y analítica web.
          </p>
          <Link
            href="/gestion/asociacion"
            className="mt-2 inline-block text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            ← Volver a Asociación
          </Link>
        </div>
        {me.rol === 'ADMIN' && (
          <Link
            href="/gestion/asociacion/datos/puntos-pueblos"
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Puntos Pueblos
          </Link>
        )}
      </div>

      <DatosTabs defaultTab={activeTab} />
    </main>
  );
}
