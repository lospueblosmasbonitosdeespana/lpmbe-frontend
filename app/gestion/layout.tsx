import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMeServer } from '@/lib/me';

export const metadata: Metadata = {
  title: 'Gestión',
  robots: { index: false, follow: false },
};

export default async function GestionLayout({ children }: { children: React.ReactNode }) {
  const me = await getMeServer();

  if (!me) {
    redirect('/entrar');
  }

  const allowedRoles = new Set(['ADMIN', 'EDITOR', 'ALCALDE', 'COLABORADOR']);
  if (!allowedRoles.has(me.rol)) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6">
          <h1 className="text-xl font-semibold text-amber-900">Acceso restringido</h1>
          <p className="mt-3 text-sm text-amber-900">
            Esta pagina es solo para pueblos o administradores de la pagina.
          </p>
          <p className="mt-2 text-sm text-amber-900">
            Si eres usuario o cliente, debes entrar por <strong>Mi cuenta</strong>.
          </p>
          <div className="mt-5">
            <Link
              href="/mi-cuenta"
              className="inline-flex items-center rounded-md border border-amber-700 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
            >
              Ir a Mi cuenta
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
