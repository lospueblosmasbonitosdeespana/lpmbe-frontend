import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function GestionPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  // Si es ALCALDE, verificamos que el pueblo está en su lista.
  if (me.rol === 'ALCALDE') {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect('/gestion/mis-pueblos');
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Gestión del pueblo</h1>
      <p className="mt-2 text-sm text-gray-600">
        Pueblo: <strong>{slug}</strong> (placeholder)
      </p>

      <div className="mt-6 rounded-md border p-4 text-sm text-gray-600">
        <div className="font-medium text-gray-800">Acciones</div>
        <div className="mt-3 flex gap-4 text-sm">
          <Link className="hover:underline" href={`/gestion/pueblos/${slug}/noticias`}>
            Noticias
          </Link>
          <Link className="hover:underline" href={`/gestion/pueblos/${slug}/eventos`}>
            Eventos
          </Link>
          <Link className="hover:underline" href={`/gestion/pueblos/${slug}/alertas`}>
            Alertas
          </Link>
        </div>
      </div>

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href="/gestion/mis-pueblos">← Volver a pueblos</Link>
      </div>
    </main>
  );
}

