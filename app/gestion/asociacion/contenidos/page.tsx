import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import ContenidoItem from './ContenidoItem';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type TematicaPage = {
  id: number;
  titulo: string;
  published: boolean;
  category: string;
};

type TematicasPages = {
  GASTRONOMIA?: TematicaPage;
  NATURALEZA?: TematicaPage;
  CULTURA?: TematicaPage;
  EN_FAMILIA?: TematicaPage;
  PETFRIENDLY?: TematicaPage;
};

const CATEGORIAS = [
  { key: 'GASTRONOMIA', label: 'Gastronomía' },
  { key: 'NATURALEZA', label: 'Naturaleza' },
  { key: 'CULTURA', label: 'Cultura' },
  { key: 'EN_FAMILIA', label: 'En familia' },
  { key: 'PETFRIENDLY', label: 'Petfriendly' },
];

async function fetchContenidos(tipo?: string) {
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const baseUrl = `${proto}://${host}`;

  const params = new URLSearchParams();
  params.set('limit', '100');
  if (tipo) params.set('tipo', tipo);

  const res = await fetch(`${baseUrl}/api/gestion/asociacion/contenidos?${params.toString()}`, {
    cache: 'no-store',
    headers: { cookie: h.get('cookie') ?? '' },
  });
  if (!res.ok) return [];
  const json = await res.json().catch(() => ({}));
  const items = Array.isArray(json) ? json : (json?.items ?? []);
  return items;
}

async function fetchTematicasAsociacion(): Promise<TematicasPages> {
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const baseUrl = `${proto}://${host}`;

  try {
    const res = await fetch(`${baseUrl}/api/admin/asociacion/pages`, {
      cache: 'no-store',
      headers: { cookie: h.get('cookie') ?? '' },
    });
    if (!res.ok) return {};
    return await res.json().catch(() => ({}));
  } catch {
    return {};
  }
}

export default async function ContenidosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN') redirect('/cuenta');

  const params = await searchParams;
  const contenidos = await fetchContenidos(params.tipo);
  const tematicas = await fetchTematicasAsociacion();

  // Título según tipo
  let tipoLabel = 'Contenidos';
  if (params.tipo === 'NOTICIA') tipoLabel = 'Noticias globales';
  else if (params.tipo === 'EVENTO') tipoLabel = 'Eventos globales';
  else if (params.tipo === 'ARTICULO') tipoLabel = 'Artículos';

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{tipoLabel}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {params.tipo ? `${tipoLabel} de la asociación` : 'Gestión de páginas, noticias, eventos y artículos'}
          </p>
        </div>

        <Link
          className="rounded-md border px-3 py-2 text-sm hover:underline"
          href="/gestion/asociacion/contenidos/nuevo"
        >
          + Nuevo {params.tipo === 'NOTICIA' ? 'noticia' : params.tipo === 'EVENTO' ? 'evento' : 'contenido'}
        </Link>
      </div>

      {/* Sección: Páginas temáticas (solo si no hay filtro de tipo) */}
      {!params.tipo && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Páginas temáticas (Asociación)</h2>
          <p className="mt-1 text-sm text-gray-600">
            Contenido visible en /experiencias (Gastronomía, Naturaleza, etc.)
          </p>

          <div className="mt-4 space-y-2">
            {CATEGORIAS.map((cat) => {
              const page = tematicas[cat.key as keyof TematicasPages];
              
              return (
                <div
                  key={cat.key}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{cat.label}</p>
                    {page ? (
                      <p className="text-sm text-gray-600">
                        {page.titulo}{' '}
                        <span className={page.published ? 'text-green-600' : 'text-orange-600'}>
                          ({page.published ? 'Publicada' : 'Borrador'})
                        </span>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">Vacía</p>
                    )}
                  </div>

                  <Link
                    href={`/gestion/asociacion/contenidos/nuevo?tipo=PAGINA&category=${cat.key}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {page ? 'Editar' : 'Crear'}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Sección: Contenidos legacy (noticias, eventos, artículos) */}
      {contenidos.length === 0 && params.tipo ? (
        <div className="mt-6 rounded-md border p-4 text-sm text-gray-600">
          No hay {tipoLabel.toLowerCase()} todavía.
        </div>
      ) : contenidos.length > 0 ? (
        <section className="mt-8">
          {!params.tipo && <h2 className="mb-4 text-lg font-semibold">Otros contenidos</h2>}
          <ul className="space-y-3">
            {contenidos.map((c: any) => (
              <ContenidoItem key={c.id} contenido={c} />
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href="/gestion/asociacion">
          ← Volver
        </Link>
      </div>
    </main>
  );
}
