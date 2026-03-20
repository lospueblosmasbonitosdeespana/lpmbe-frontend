import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import SeasonalEventForm from './SeasonalEventForm.client';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default async function AppEventoActivoPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <Link className="text-sm text-muted-foreground hover:underline" href="/gestion/asociacion/app">
        ← Volver a App
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Evento estacional en botón de app</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Elige qué evento aparece en el acceso rápido de la Home de la app móvil.
      </p>

      <div className="mt-6">
        <SeasonalEventForm />
      </div>
    </main>
  );
}
