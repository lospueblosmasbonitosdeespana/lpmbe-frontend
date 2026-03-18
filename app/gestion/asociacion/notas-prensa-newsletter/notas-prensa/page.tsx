import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import NotasPrensaNewsletterClient from '../NotasPrensaNewsletterClient';

export const dynamic = 'force-dynamic';

export default async function NotasPrensaPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Gestión Notas de prensa</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gestión de contactos de prensa y campañas segmentadas.
      </p>
      <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Nuevo sistema activo: editor/PDF, vista previa y botón &quot;Subir a la web&quot;.
      </div>
      <div className="mt-4">
        <Link
          href="/gestion/asociacion/notas-prensa-newsletter/notas-prensa/contactos"
          className="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Gestionar contactos de prensa
        </Link>
      </div>

      <NotasPrensaNewsletterClient mode="press" />

      <div className="mt-10 text-sm">
        <Link
          className="text-muted-foreground hover:text-foreground hover:underline"
          href="/gestion/asociacion/notas-prensa-newsletter"
        >
          ← Volver al selector
        </Link>
      </div>
    </main>
  );
}
