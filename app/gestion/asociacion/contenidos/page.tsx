import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import ContenidoItem from './ContenidoItem';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
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
  PATRIMONIO?: TematicaPage;
};

const CATEGORIAS = [
  { key: 'GASTRONOMIA', label: 'Gastronomía' },
  { key: 'NATURALEZA', label: 'Naturaleza' },
  { key: 'CULTURA', label: 'Cultura' },
  { key: 'EN_FAMILIA', label: 'En familia' },
  { key: 'PETFRIENDLY', label: 'Petfriendly' },
  { key: 'PATRIMONIO', label: 'Patrimonio' },
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

  const tematicasConContenido = CATEGORIAS.filter(
    (cat) => !!tematicas[cat.key as keyof TematicasPages]
  ).length;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/gestion/asociacion"
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:border-primary/25 hover:bg-muted/50 hover:text-foreground"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Volver a gestión de la asociación
      </Link>

      <div
        className="relative mb-8 overflow-hidden rounded-2xl p-6 text-white sm:p-8"
        style={{ background: 'linear-gradient(135deg, #a0705a 0%, #b8856d 40%, #c49a82 100%)' }}
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/6 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-inner backdrop-blur-sm">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{tipoLabel}</h1>
              <p className="mt-0.5 text-sm text-white/80">
                {params.tipo
                  ? `${tipoLabel} · Asociación LPMBE`
                  : 'Páginas temáticas, noticias, eventos y artículos nacionales'}
              </p>
            </div>
          </div>
          <Link
            href="/gestion/asociacion/contenidos/nuevo"
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm transition-all hover:bg-white/25 hover:ring-white/40 active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo {params.tipo === 'NOTICIA' ? 'noticia' : params.tipo === 'EVENTO' ? 'evento' : 'contenido'}
          </Link>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-3">
          {!params.tipo && (
            <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
              <span className="text-lg font-bold">{tematicasConContenido}</span>
              <span className="ml-1.5 text-xs text-white/70">/ {CATEGORIAS.length} temáticas con contenido</span>
            </div>
          )}
          <div className="rounded-xl bg-white/10 px-4 py-2 ring-1 ring-white/15 backdrop-blur-sm">
            <span className="text-lg font-bold">{contenidos.length}</span>
            <span className="ml-1.5 text-xs text-white/70">
              {contenidos.length === 1 ? 'entrada en listado' : 'entradas en listado'}
            </span>
          </div>
        </div>
      </div>

      {!params.tipo && (
        <section className="mb-10 overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-b from-violet-50/50 to-white p-6 shadow-md shadow-violet-100/40">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-200">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Páginas temáticas (Asociación)</h2>
              <p className="text-sm text-muted-foreground">Visibles en /experiencias (Gastronomía, Naturaleza, etc.)</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {CATEGORIAS.map((cat) => {
              const page = tematicas[cat.key as keyof TematicasPages];

              return (
                <div
                  key={cat.key}
                  className="flex flex-col gap-3 rounded-xl border border-violet-100 bg-white p-4 shadow-sm transition-all hover:border-violet-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{cat.label}</p>
                    {page ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        <span className="text-foreground/90">{page.titulo}</span>{' '}
                        <span
                          className={
                            page.published
                              ? 'font-medium text-emerald-600'
                              : 'font-medium text-amber-700'
                          }
                        >
                          · {page.published ? 'Publicada' : 'Borrador'}
                        </span>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">Sin contenido todavía</p>
                    )}
                  </div>

                  <Link
                    href={`/gestion/asociacion/contenidos/nuevo?tipo=PAGINA&category=${cat.key}`}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:from-primary/90 hover:to-primary/80 active:scale-[0.98]"
                  >
                    {page ? 'Editar' : 'Crear'}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {contenidos.length === 0 && params.tipo ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
            <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-semibold text-foreground">No hay {tipoLabel.toLowerCase()} todavía</p>
          <p className="mt-1 text-sm text-muted-foreground">Crea la primera desde el botón del encabezado.</p>
        </div>
      ) : contenidos.length > 0 ? (
        <section>
          {!params.tipo && (
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-800">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-foreground">Otros contenidos</h2>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                {contenidos.length}
              </span>
            </div>
          )}
          <ul className="flex flex-col gap-4">
            {contenidos.map((c: any) => (
              <ContenidoItem key={c.id} contenido={c} />
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-10 border-t border-border/60 pt-6">
        <Link
          href="/gestion/asociacion"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a gestión de la asociación
        </Link>
      </div>
    </main>
  );
}
