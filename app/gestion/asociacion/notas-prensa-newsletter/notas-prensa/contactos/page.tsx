import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import PressContactsManagerClient from './PressContactsManagerClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default async function PressContactsManagerPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Contactos de prensa</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Consulta, edita y elimina contactos de prensa.
      </p>

      <PressContactsManagerClient />

      <div className="mt-10 text-sm">
        <Link
          className="text-muted-foreground hover:text-foreground hover:underline"
          href="/gestion/asociacion/notas-prensa-newsletter/notas-prensa"
        >
          ← Volver a Notas de prensa
        </Link>
      </div>
    </main>
  );
}
