import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getMeServer } from '@/lib/me';

export const metadata: Metadata = {
  title: 'Gestión',
  robots: { index: false, follow: false },
};

export default async function GestionLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('gestion');
  const me = await getMeServer();

  if (!me) {
    redirect('/entrar');
  }

  const allowedRoles = new Set(['ADMIN', 'EDITOR', 'ALCALDE', 'COLABORADOR']);
  if (!allowedRoles.has(me.rol)) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6">
          <h1 className="text-xl font-semibold text-amber-900">{t('accessRestrictedTitle')}</h1>
          <p className="mt-3 text-sm text-amber-900">
            {t('accessRestrictedOnlyAdmins')}
          </p>
          <p className="mt-2 text-sm text-amber-900">
            {t('accessRestrictedUsersToAccount')}
          </p>
          <div className="mt-5">
            <Link
              href="/mi-cuenta"
              className="inline-flex items-center rounded-md border border-amber-700 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              {t('goToMyAccount')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
