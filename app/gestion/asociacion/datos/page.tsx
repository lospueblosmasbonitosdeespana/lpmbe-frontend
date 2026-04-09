import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
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
  const allowedTabs = me.rol === 'ADMIN'
    ? ['usuarios', 'pueblos', 'metricas-pueblos', 'web', 'app', 'interno', 'puntos', 'newsletter']
    : ['usuarios', 'pueblos', 'metricas-pueblos', 'web', 'app', 'interno', 'puntos'];
  const activeTab = allowedTabs.includes(tab ?? '')
    ? (tab as 'usuarios' | 'pueblos' | 'metricas-pueblos' | 'web' | 'app' | 'interno' | 'puntos' | 'newsletter')
    : 'usuarios';
  const t = await getTranslations('gestion');

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {t('datosTitle')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('datosDescription')}
          </p>
          <Link
            href="/gestion/asociacion"
            className="mt-2 inline-block text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {t('backToAssociation')}
          </Link>
        </div>
      </div>

      <DatosTabs defaultTab={activeTab} canViewNewsletter={me.rol === 'ADMIN'} />
    </main>
  );
}
