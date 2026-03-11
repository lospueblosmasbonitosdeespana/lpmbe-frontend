import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import PaginaWebAppForm from './PaginaWebAppForm.client';

export const dynamic = 'force-dynamic';

export default async function AppPaginaWebPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link className="text-sm text-muted-foreground hover:underline" href="/gestion/asociacion/app">
        ← Volver a App
      </Link>

      <h1 className="mt-4 text-2xl font-semibold">Página app en la web</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Configura el contenido de la página pública de la app (`/app`) para mostrar capturas, funcionalidades y botones de descarga.
      </p>

      <div className="mt-6">
        <PaginaWebAppForm />
      </div>
    </main>
  );
}
