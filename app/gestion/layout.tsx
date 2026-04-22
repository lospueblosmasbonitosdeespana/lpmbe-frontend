import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getMeServerDetailed } from '@/lib/me';

export const metadata: Metadata = {
  title: 'Gestión',
  robots: { index: false, follow: false },
};

export default async function GestionLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('gestion');
  const meResult = await getMeServerDetailed();

  if (meResult.kind === 'anon' || meResult.kind === 'expired') {
    redirect('/entrar');
  }

  // Backend no respondió pese a haber sesión (p.ej. Railway degradado).
  // No expulsamos al admin/alcalde: mostramos pantalla de reintento
  // con refresco automático, para no romper el acceso a /gestion.
  if (meResult.kind === 'unavailable') {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <meta httpEquiv="refresh" content="5" />
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6">
          <h1 className="text-xl font-semibold text-amber-900">
            Servicio temporalmente no disponible
          </h1>
          <p className="mt-3 text-sm text-amber-900">
            No hemos podido confirmar tu sesión con el servidor. Esto suele
            deberse a una incidencia transitoria del proveedor. Volveremos a
            intentarlo automáticamente en unos segundos.
          </p>
          <div className="mt-5">
            <Link
              href="/gestion"
              className="inline-flex items-center rounded-md border border-amber-700 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              Reintentar ahora
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const me = meResult.user;
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
