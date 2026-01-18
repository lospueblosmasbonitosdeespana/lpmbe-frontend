import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { redirect } from 'next/navigation';
import { getPuebloBySlug } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function NoticiasPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  // Verificar acceso
  if (me.rol === 'ALCALDE') {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect('/gestion/mis-pueblos');
  }

  // Obtener puebloId para redirect
  let puebloId: number | null = null;
  try {
    const pueblo = await getPuebloBySlug(slug);
    puebloId = pueblo.id;
  } catch (e) {
    // Si falla, redirect sin puebloId (la página lo resolverá)
  }

  // REDIRECT A CMS NUEVO
  redirect(`/gestion/pueblo/contenidos?tipo=NOTICIA${puebloId ? `&puebloId=${puebloId}` : ''}`);
}
  const { slug } = await params;
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  if (me.rol === 'ALCALDE') {
    const mis = await getMisPueblosServer();
    if (!mis.some((p) => p.slug === slug)) redirect('/gestion/mis-pueblos');
  }

  const noticias = await fetchNoticias(slug);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Noticias</h1>
          <p className="mt-1 text-sm text-gray-600">
            Pueblo: <strong>{slug}</strong>
          </p>
        </div>

        <Link
          className="rounded-md border px-3 py-2 text-sm hover:underline"
          href={`/gestion/pueblos/${slug}/noticias/nueva`}
        >
          + Nueva noticia
        </Link>
      </div>

      {noticias.length === 0 ? (
        <div className="mt-6 rounded-md border p-4 text-sm text-gray-600">
          No hay noticias todavía.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {noticias.map((n: any) => (
            <li key={n.id ?? n.slug ?? n.titulo} className="rounded-md border p-4">
              <div className="font-medium">{n.titulo ?? '(sin título)'}</div>
              <div className="mt-1 text-xs text-gray-500">
                {n.fecha ? String(n.fecha) : ''}
              </div>
              {n.contenido ? (
                <div className="mt-2 text-sm text-gray-700">
                  {String(n.contenido).slice(0, 200)}
                  {String(n.contenido).length > 200 ? '…' : ''}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href={`/gestion/pueblos/${slug}`}>
          ← Volver a gestión del pueblo
        </Link>
      </div>
    </main>
  );
}

