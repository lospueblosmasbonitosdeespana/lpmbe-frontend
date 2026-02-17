// app/cuenta/page.tsx
import { redirect } from 'next/navigation';
import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import LogoutButton from './LogoutButton';
import ThemeSelector from './ThemeSelector';
import Link from 'next/link';
import { IconMapa, IconAsociacion } from '@/app/gestion/_components/GestionIcons';
import { getTranslations } from 'next-intl/server';

function GridCard({
  href,
  title,
  description,
  icon,
  loginText,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  loginText: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground group-hover:text-primary">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
        {loginText}
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}

export default async function CuentaPage() {
  const t = await getTranslations('cuenta');
  const me = await getMeServer();

  if (!me) {
    redirect('/entrar');
  }

  const misPueblos =
    me.rol === 'ALCALDE' || me.rol === 'ADMIN'
      ? await getMisPueblosServer()
      : [];

  const rolBadgeClass =
    me.rol === 'ADMIN'
      ? 'bg-primary/15 text-primary border-primary/30'
      : me.rol === 'ALCALDE'
        ? 'bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400 dark:border-amber-400/30'
        : me.rol === 'CLIENTE'
          ? 'bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400 dark:border-green-400/30'
          : 'bg-muted text-muted-foreground border-border';

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">{t('account')}</h1>

      <section className="mt-6">
        <div className="mb-6">
          <ThemeSelector />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('email')}
              </span>
              <div className="mt-1 font-medium text-foreground">{me.email}</div>
            </div>
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('role')}
              </span>
              <div className="mt-2 space-y-1">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${rolBadgeClass}`}
                >
                  {me.rol === 'ADMIN' ? t('admin') : me.rol === 'ALCALDE' ? t('mayor') : me.rol === 'CLIENTE' ? t('client') : t('user')}
                </span>
                {me.rol === 'ALCALDE' && misPueblos.length > 0 && (
                  <div className="text-sm font-medium text-foreground">
                    {misPueblos.length === 1 ? (
                      misPueblos[0].nombre
                    ) : (
                      misPueblos.map((p) => p.nombre).join(', ')
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 space-y-3">
        {(me.rol === 'USUARIO' || me.rol === 'CLIENTE') ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="font-medium">{t('yourAccount')}</div>
            <div className="text-sm text-muted-foreground">
              {me.rol === 'CLIENTE'
                ? t('accountDesc')
                : t('basicArea')}
            </div>
            <Link href="/mi-cuenta" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              {t('goToAccount')}
            </Link>
          </div>
        ) : null}

        {(me.rol === 'ALCALDE' || me.rol === 'ADMIN') ? (
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t('management')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <GridCard
                href={me.rol === 'ALCALDE' ? '/gestion/mis-pueblos' : '/gestion'}
                title={
                  me.rol === 'ALCALDE' && misPueblos.length === 1
                    ? misPueblos[0].nombre
                    : me.rol === 'ADMIN'
                      ? t('villageManagement')
                      : t('myVillages')
                }
                description={
                  me.rol === 'ALCALDE'
                    ? misPueblos.length === 0
                      ? t('noVillages')
                      : misPueblos.length === 1
                        ? `${t('manage')} ${misPueblos[0].nombre}`
                        : `${t('manageYour')} ${misPueblos.length} ${t('villages')}`
                    : t('allVillages')
                }
                icon={<IconMapa />}
                loginText={t('login')}
              />
              {me.rol === 'ADMIN' && (
                <GridCard
                  href="/gestion/asociacion"
                  title={t('association')}
                  description={t('associationDesc')}
                  icon={<IconAsociacion />}
                  loginText={t('login')}
                />
              )}
            </div>
            {me.rol === 'ALCALDE' && misPueblos.length === 1 && (
              <p className="mt-3 text-sm text-muted-foreground">
                <Link
                  href={`/pueblos/${misPueblos[0].slug}`}
                  className="text-primary hover:underline"
                >
                  {t('viewVillage')}
                </Link>
              </p>
            )}
          </div>
        ) : null}
      </section>

      <LogoutButton />
    </main>
  );
}
