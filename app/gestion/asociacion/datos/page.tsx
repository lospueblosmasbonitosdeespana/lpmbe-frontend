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
  const activeTab = ['usuarios', 'pueblos', 'web'].includes(tab ?? '')
    ? (tab as 'usuarios' | 'pueblos' | 'web')
    : 'usuarios';

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
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

      <DatosTabs defaultTab={activeTab} />
    </main>
  );
}
