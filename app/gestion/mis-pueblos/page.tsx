import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getAllPueblosServer } from '@/lib/pueblosAdmin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function MisPueblosGestionPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/cuenta');

  const pueblos =
    me.rol === 'ADMIN' || me.rol === 'EDITOR'
      ? await getAllPueblosServer()
      : await getMisPueblosServer();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">
        {me.rol === 'ADMIN' || me.rol === 'EDITOR' ? 'Todos los pueblos' : 'Mis pueblos'}
      </h1>

      <p className="mt-2 text-sm text-gray-600">
        {me.rol === 'ADMIN'
          ? 'Como ADMIN puedes gestionar cualquier pueblo.'
          : me.rol === 'EDITOR'
            ? 'Como EDITOR puedes editar contenidos de cualquier pueblo.'
            : 'Como ALCALDE solo puedes gestionar tus pueblos asignados.'}
      </p>

      {pueblos.length === 0 ? (
        <div className="mt-6 rounded-md border p-4 text-sm text-gray-600">
          No hay pueblos disponibles.
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {pueblos.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-medium">{p.nombre || `Pueblo ${p.id}`}</div>
                {(me.rol === 'ADMIN' || me.rol === 'EDITOR') && (
                  <div className="text-xs text-gray-500">{p.slug}</div>
                )}
              </div>

              <div className="flex gap-3 text-sm">
                <Link className="hover:underline" href={`/pueblos/${p.slug}`}>
                  Ver ficha
                </Link>
                <Link className="hover:underline" href={`/gestion/pueblos/${p.slug}`}>
                  Gestionar →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href="/gestion">← Volver</Link>
      </div>
    </main>
  );
}
