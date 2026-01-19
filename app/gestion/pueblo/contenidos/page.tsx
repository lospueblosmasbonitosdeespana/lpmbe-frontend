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
  searchParams: Promise<{ puebloId?: string; puebloNombre?: string; tipo?: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  const params = await searchParams;
  
  // puebloId OBLIGATORIO (source of truth desde searchParams)
  if (!params.puebloId) {
    // Si no viene puebloId, redirigir a mis-pueblos
    redirect('/gestion/mis-pueblos');
  }

  const puebloId = Number(params.puebloId);
  
  // Validar que sea número válido
  if (Number.isNaN(puebloId) || puebloId <= 0) {
    redirect('/gestion/mis-pueblos');
  }

  // Obtener nombre del pueblo real
  let puebloNombre = `Pueblo #${puebloId}`; // Fallback con espacio y #
  
  // Prioridad 1: puebloNombre desde query params (viene del dashboard)
  if (params.puebloNombre) {
    puebloNombre = decodeURIComponent(params.puebloNombre);
  } 
  // Prioridad 2: buscar en mis pueblos (alcaldes)
  else if (me.rol === 'ALCALDE') {
    const misPueblos = await getMisPueblosServer();
    const pueblo = misPueblos.find(p => p.id === puebloId);
    if (pueblo) puebloNombre = pueblo.nombre;
  }
  // Admin sin puebloNombre: queda el fallback "Pueblo #37"

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
          href={`/gestion/pueblo/contenidos/nuevo?puebloId=${puebloId}&puebloNombre=${encodeURIComponent(puebloNombre)}`}
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
