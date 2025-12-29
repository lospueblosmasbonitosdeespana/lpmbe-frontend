// app/gestion/page.tsx
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function GestionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');

  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') {
    redirect('/cuenta');
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Gestión</h1>
      <p className="mt-2 text-sm text-gray-600">
        Placeholder para alcaldes/admin. Aquí irá la gestión de contenidos.
      </p>

      <section className="mt-8 space-y-3">
        <div className="rounded-md border p-4">
          <div className="font-medium">Accesos</div>
          <ul className="mt-3 list-disc pl-5 text-sm">
            <li>
              <Link className="hover:underline" href="/gestion/mis-pueblos">
                Mis pueblos (placeholder)
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/gestion/noticias">
                Noticias (placeholder)
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/gestion/eventos">
                Eventos (placeholder)
              </Link>
            </li>
          </ul>
        </div>

        <div className="text-sm">
          <Link className="hover:underline" href="/cuenta">
            ← Volver a cuenta
          </Link>
        </div>
      </section>
    </main>
  );
}

