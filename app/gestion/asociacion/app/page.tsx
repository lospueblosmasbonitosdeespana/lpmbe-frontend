import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';

export default async function AppGestionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion"
          className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver
        </Link>
        <h1 className="text-3xl font-bold">Gestión · App</h1>
        <p className="mt-2 text-muted-foreground">
          Pop-ups y ofertas que verán los usuarios en la app móvil. Configura cuándo salen, cada cuánto y si en home o al abrir la app.
        </p>
      </div>

      <div className="space-y-4">
        <Link
          href="/gestion/asociacion/app/promos"
          className="block rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="text-xl font-semibold">Pop-ups y ofertas</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Crear y editar pop-ups (título, texto, imagen opcional, botón). Definir fechas, si se muestra en home o al abrir la app, frecuencia (una vez, cada día, cada sesión, siempre) y retraso en segundos.
          </p>
        </Link>
      </div>
    </main>
  );
}
