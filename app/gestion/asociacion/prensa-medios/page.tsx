import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import PrensaMediosForm from './PrensaMediosForm.client';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default async function PrensaMediosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Prensa y Medios</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Configura qué se muestra en la página pública de prensa: comunicados visibles, enlaces de medios externos y contenido del kit de prensa.
      </p>

      <PrensaMediosForm />

      <div className="mt-10 text-sm">
        <Link className="text-muted-foreground hover:text-foreground hover:underline" href="/gestion/asociacion">
          ← Volver a gestión
        </Link>
      </div>
    </main>
  );
}
