import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import MiCuentaUsuariosClient from './MiCuentaUsuariosClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default async function MiCuentaUsuariosAdminPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-2xl font-semibold">Mi Cuenta (usuarios) — iconos y avatares</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sube los iconos que se muestran en{' '}
        <code className="rounded bg-muted px-1.5 py-0.5">/mi-cuenta</code>: el escudo del Club que
        aparece arriba y los avatares de cada nivel. Si no subes nada, la web sigue usando los
        ficheros por defecto del sitio.
      </p>

      <MiCuentaUsuariosClient />
    </main>
  );
}
