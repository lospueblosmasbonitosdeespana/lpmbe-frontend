import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import ContenidoItem from './ContenidoItem';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchContenidos() {
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(`${baseUrl}/api/gestion/asociacion/contenidos?limit=100`, {
    cache: 'no-store',
    headers: { cookie: h.get('cookie') ?? '' },
  });
  if (!res.ok) return [];
  const json = await res.json().catch(() => ({}));
  const items = Array.isArray(json) ? json : (json?.items ?? []);
  return items;
}

export default async function ContenidosPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  const contenidos = await fetchContenidos();

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Contenidos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestión de páginas, noticias, eventos y artículos
          </p>
        </div>

        <Link
          className="rounded-md border px-3 py-2 text-sm hover:underline"
          href="/gestion/asociacion/contenidos/nuevo"
        >
          + Nuevo contenido
        </Link>
      </div>

      {contenidos.length === 0 ? (
        <div className="mt-6 rounded-md border p-4 text-sm text-gray-600">
          No hay contenidos todavía.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {contenidos.map((c: any) => (
            <ContenidoItem key={c.id} contenido={c} />
          ))}
        </ul>
      )}

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href="/gestion/asociacion">
          ← Volver
        </Link>
      </div>
    </main>
  );
}
