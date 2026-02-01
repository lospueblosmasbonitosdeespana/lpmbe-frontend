import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { getPuebloBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  // Resolver pueblo real
  let puebloNombre = slug;
  let puebloId: number | null = null;
  try {
    const pueblo = await getPuebloBySlug(slug);
    puebloNombre = pueblo.nombre ?? slug;
    puebloId = pueblo.id;
  } catch (e) {
    // Si falla, usar slug como fallback
    puebloNombre = slug;
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">Gestión del pueblo</h1>
      <p className="mt-2 text-sm text-gray-600">
        Pueblo: <strong>{puebloNombre}</strong>
      </p>

      <div className="mt-6 rounded-md border p-4 text-sm text-gray-600">
        <div className="font-medium text-gray-800">Acciones</div>
        <div className="mt-3 flex gap-4 text-sm flex-wrap">
          {puebloId ? (
            <>
              <Link className="hover:underline" href={`/gestion/pueblo/contenidos?puebloId=${puebloId}&puebloNombre=${encodeURIComponent(puebloNombre)}&tipo=NOTICIA`}>
                Noticias
              </Link>
              <Link className="hover:underline" href={`/gestion/pueblo/contenidos?puebloId=${puebloId}&puebloNombre=${encodeURIComponent(puebloNombre)}&tipo=EVENTO`}>
                Eventos
              </Link>
              <Link className="hover:underline" href={`/gestion/pueblo/contenidos?puebloId=${puebloId}&puebloNombre=${encodeURIComponent(puebloNombre)}`}>
                Contenidos
              </Link>
            </>
          ) : (
            <span className="text-red-600">Error: No se pudo obtener el ID del pueblo</span>
          )}
          <Link className="hover:underline" href={`/gestion/pueblos/${slug}/alertas`}>
            Alertas
          </Link>
          <Link className="hover:underline" href={`/gestion/pueblos/${slug}/semaforo`}>
            Semáforo
          </Link>
          <Link className="hover:underline" href={`/gestion/pueblos/${slug}/club`}>
            Club de Amigos
          </Link>
          <Link className="hover:underline" href={`/gestion/pueblos/${slug}/fotos`}>
            Fotos del pueblo
          </Link>
          <Link className="hover:underline" href={`/gestion/pueblos/${slug}/descripcion`}>
            Descripción del pueblo
          </Link>
          <Link className="hover:underline" href={`/gestion/pueblos/${slug}/pois`}>
            POIs
          </Link>
          <Link className="hover:underline" href={`/gestion/pueblos/${slug}/multiexperiencias`}>
            Multiexperiencias
          </Link>
          {me.rol === 'ADMIN' && (
            <Link className="hover:underline text-blue-700 font-medium" href={`/gestion/pueblos/${slug}/autorizados`}>
              Autorizados
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href="/gestion/mis-pueblos">← Volver a pueblos</Link>
      </div>
    </main>
  );
}

