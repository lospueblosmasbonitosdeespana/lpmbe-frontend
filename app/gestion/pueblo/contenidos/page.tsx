import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import ContenidoItemPueblo from './ContenidoItemPueblo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchContenidosPueblo(puebloId: number, tipo?: string) {
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const baseUrl = `${proto}://${host}`;

  const params = new URLSearchParams();
  params.set('puebloId', String(puebloId));
  params.set('limit', '100');
  if (tipo) params.set('tipo', tipo);

  const res = await fetch(`${baseUrl}/api/gestion/pueblo/contenidos?${params.toString()}`, {
    cache: 'no-store',
    headers: { cookie: h.get('cookie') ?? '' },
  });
  if (!res.ok) return [];
  const json = await res.json().catch(() => ({}));
  const items = Array.isArray(json) ? json : (json?.items ?? []);
  return items;
}

export default async function ContenidosPuebloPage({
  searchParams,
}: {
  searchParams: Promise<{ puebloId?: string; tipo?: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  const params = await searchParams;
  
  // Si viene puebloId en query, usarlo; sino, usar primer pueblo de alcalde
  let puebloId: number;
  let puebloNombre: string;
  
  if (params.puebloId) {
    puebloId = Number(params.puebloId);
    // Obtener nombre del pueblo (simplificado: podrías hacer fetch si lo necesitas)
    puebloNombre = 'Pueblo';
  } else {
    const misPueblos = await getMisPueblosServer();
    if (misPueblos.length === 0) {
      // Si falla getMisPueblos, redirigir a mis-pueblos en vez de /gestion
      redirect('/gestion/mis-pueblos');
    }
    puebloId = misPueblos[0].id;
    puebloNombre = misPueblos[0].nombre;
  }

  const contenidos = await fetchContenidosPueblo(puebloId, params.tipo);
  
  // Título según tipo
  let tipoLabel = 'Contenidos';
  if (params.tipo === 'NOTICIA') tipoLabel = 'Noticias';
  else if (params.tipo === 'EVENTO') tipoLabel = 'Eventos';
  else if (params.tipo === 'ARTICULO') tipoLabel = 'Artículos';

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{tipoLabel} · {puebloNombre}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {params.tipo ? `${tipoLabel} de tu pueblo` : 'Páginas, noticias y eventos de tu pueblo'}
          </p>
        </div>

        <Link
          className="rounded-md border px-3 py-2 text-sm hover:underline"
          href={`/gestion/pueblo/contenidos/nuevo${params.puebloId ? `?puebloId=${params.puebloId}` : ''}`}
        >
          + Nuevo {params.tipo === 'NOTICIA' ? 'noticia' : params.tipo === 'EVENTO' ? 'evento' : 'contenido'}
        </Link>
      </div>

      {contenidos.length === 0 ? (
        <div className="mt-6 rounded-md border p-4 text-sm text-gray-600">
          No hay {tipoLabel.toLowerCase()} todavía.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {contenidos.map((c: any) => (
            <ContenidoItemPueblo key={c.id} contenido={c} />
          ))}
        </ul>
      )}

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href="/gestion">
          ← Volver
        </Link>
      </div>
    </main>
  );
}
