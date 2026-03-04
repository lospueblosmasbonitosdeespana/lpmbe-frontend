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
  const activeTab = ['usuarios', 'pueblos', 'web', 'app', 'interno', 'puntos'].includes(tab ?? '')
    ? (tab as 'usuarios' | 'pueblos' | 'web' | 'app' | 'interno' | 'puntos')
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
        {me.rol === 'ADMIN' && (
          <Link
            href="/gestion/asociacion/datos/puntos-pueblos"
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            {t('puntosPueblosLink')}
          </Link>
        )}
      </div>

      <DatosTabs defaultTab={activeTab} />
    </main>
  );
}
