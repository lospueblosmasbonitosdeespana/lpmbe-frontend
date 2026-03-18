import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import NotasPrensaNewsletterClient from './NotasPrensaNewsletterClient';

export const dynamic = 'force-dynamic';

export default async function NotasPrensaNewsletterPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Notas de prensa y Newsletter</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gestión unificada de suscriptores, contactos de prensa y campañas con métricas de envío.
      </p>

      <NotasPrensaNewsletterClient />

      <div className="mt-10 text-sm">
        <Link className="text-muted-foreground hover:text-foreground hover:underline" href="/gestion/asociacion">
          ← Volver a gestión
        </Link>
      </div>
    </main>
  );
}
