import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NoticiasGlobalesPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  // REDIRECT A CMS NUEVO
  redirect('/gestion/asociacion/contenidos?tipo=NOTICIA');
}
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const baseUrl = `${proto}://${host}`;

  const res = await fetch(`${baseUrl}/api/gestion/asociacion/noticias`, {
    cache: 'no-store',
    headers: { cookie: h.get('cookie') ?? '' },
  });
  if (!res.ok) return [];
  const json = await res.json().catch(() => ({}));
  const items = Array.isArray(json) ? json : (json?.items ?? []);
  return items;
}

export default async function NoticiasGlobalesPage() {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  const noticias = await fetchNoticiasGlobales();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Noticias globales</h1>
          <p className="mt-1 text-sm text-gray-600">Asociación · Nacional</p>
        </div>

        <Link
          className="rounded-md border px-3 py-2 text-sm hover:underline"
          href="/gestion/asociacion/noticias/nueva"
        >
          + Nueva noticia
        </Link>
      </div>

      {noticias.length === 0 ? (
        <div className="mt-6 rounded-md border p-4 text-sm text-gray-600">
          No hay noticias globales todavía.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {noticias.map((n: any) => (
            <NoticiaItem key={n.id ?? n.titulo} noticia={n} />
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

