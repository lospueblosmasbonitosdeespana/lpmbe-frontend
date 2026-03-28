import Link from 'next/link';
import { getMeServer } from '@/lib/me';
import { getMisPueblosServer } from '@/lib/misPueblos';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import ContenidoItemPueblo from './ContenidoItemPueblo';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 0;

const CATEGORIAS_TEMATICAS = [
  { value: 'GASTRONOMIA', label: 'Gastronomia', icon: '🍷', color: 'from-amber-500 to-orange-600' },
  { value: 'NATURALEZA', label: 'Naturaleza', icon: '🌿', color: 'from-emerald-500 to-green-600' },
  { value: 'CULTURA', label: 'Cultura', icon: '🎭', color: 'from-purple-500 to-indigo-600' },
  { value: 'EN_FAMILIA', label: 'En familia', icon: '👨‍👩‍👧', color: 'from-sky-500 to-blue-600' },
  { value: 'PETFRIENDLY', label: 'Petfriendly', icon: '🐾', color: 'from-pink-500 to-rose-600' },
  { value: 'PATRIMONIO', label: 'Patrimonio', icon: '🏛️', color: 'from-yellow-600 to-amber-700' },
];

async function fetchContenidosPueblo(puebloId: number) {
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const baseUrl = `${proto}://${host}`;

  const params = new URLSearchParams();
  params.set('puebloId', String(puebloId));
  params.set('limit', '100');

  const res = await fetch(`${baseUrl}/api/gestion/pueblo/contenidos?${params.toString()}`, {
    cache: 'no-store',
    headers: { cookie: h.get('cookie') ?? '' },
  });
  if (!res.ok) return [];
  const json = await res.json().catch(() => ({}));
  return Array.isArray(json) ? json : (json?.items ?? []);
}

function getFirstImage(items: any[]): string | null {
  for (const c of items) {
    if (c.coverUrl?.trim()) return c.coverUrl.trim();
    if (Array.isArray(c.galleryUrls)) {
      const first = c.galleryUrls.find((u: string) => u?.trim());
      if (first) return first.trim();
    }
  }
  return null;
}

const PREVIEW_COUNT = 3;

function SectionCard({
  title,
  icon,
  count,
  image,
  items,
  accentColor,
  newHref,
  newLabel,
}: {
  title: string;
  icon: string;
  count: number;
  image: string | null;
  items: any[];
  accentColor: string;
  newHref: string;
  newLabel: string;
}) {
  const preview = items.slice(0, PREVIEW_COUNT);
  const rest = items.slice(PREVIEW_COUNT);

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-stretch">
        {image ? (
          <div className="relative w-32 md:w-44 flex-shrink-0 hidden sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80" />
          </div>
        ) : (
          <div className={`relative w-32 md:w-44 flex-shrink-0 hidden sm:flex items-center justify-center bg-gradient-to-br ${accentColor}`}>
            <span className="text-5xl opacity-80">{icon}</span>
          </div>
        )}
        <div className="flex-1 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{title}</h2>
                <p className="text-sm text-muted-foreground">
                  {count === 0 ? 'Ninguno creado' : `${count} ${count === 1 ? 'publicación' : 'publicaciones'}`}
                </p>
              </div>
            </div>
            <Link
              href={newHref}
              className="rounded-lg bg-[#b5472a] px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#9e3d24] transition-colors whitespace-nowrap"
            >
              {newLabel}
            </Link>
          </div>
        </div>
      </div>

      {count > 0 && (
        <div className="border-t border-border px-5 py-4">
          <ul className="space-y-3">
            {preview.map((c: any) => (
              <ContenidoItemPueblo key={c.id} contenido={c} />
            ))}
          </ul>

          {rest.length > 0 && (
            <details className="mt-3 group">
              <summary className="cursor-pointer select-none list-none flex items-center gap-2 rounded-lg border border-[#b5472a]/30 bg-[#b5472a]/5 px-4 py-2.5 text-sm font-semibold text-[#b5472a] hover:bg-[#b5472a]/10 transition-colors">
                <svg className="h-4 w-4 transition-transform group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
                Ver {rest.length === 1 ? `1 más` : `${rest.length} más`} ({count} en total)
              </summary>
              <ul className="mt-3 space-y-3">
                {rest.map((c: any) => (
                  <ContenidoItemPueblo key={c.id} contenido={c} />
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}

function TematicaCategoryCard({
  cat,
  count,
  image,
  puebloId,
  puebloNombre,
  filterHref,
  isActive,
}: {
  cat: typeof CATEGORIAS_TEMATICAS[number];
  count: number;
  image: string | null;
  puebloId: number;
  puebloNombre: string;
  filterHref: string;
  isActive: boolean;
}) {
  const maxPages = 8;
  const progress = Math.min(count / maxPages, 1) * 100;

  return (
    <div className={`group relative rounded-lg border bg-card overflow-hidden transition hover:shadow-md ${isActive ? 'border-primary shadow-sm ring-1 ring-primary/40' : 'border-border hover:border-primary/30'}`}>
      <Link href={filterHref} className="block">
        {image ? (
          <div className="relative h-24">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={cat.label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
              <span className="text-lg">{cat.icon}</span>
              <span className="text-sm font-semibold text-white">{cat.label}</span>
            </div>
          </div>
        ) : (
          <div className={`h-24 bg-gradient-to-br ${cat.color} flex items-center justify-center gap-2`}>
            <span className="text-3xl">{cat.icon}</span>
            <span className="text-sm font-semibold text-white">{cat.label}</span>
          </div>
        )}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {count}/{maxPages} páginas
            </span>
            <span className={`text-xs font-semibold ${isActive ? 'text-primary' : 'text-[#b5472a]'}`}>
              {isActive ? '✓ Viendo' : 'Ver'}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${cat.color} transition-all`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Link>
      <div className="px-3 pb-3">
        <Link
          href={`/gestion/pueblo/contenidos/nuevo?puebloId=${puebloId}&puebloNombre=${encodeURIComponent(puebloNombre)}&tipo=PAGINA&categoria=${cat.value}`}
          className="text-xs font-medium text-[#b5472a] hover:underline"
        >
          + Crear
        </Link>
      </div>
    </div>
  );
}

export default async function ContenidosPuebloPage({
  searchParams,
}: {
  searchParams: Promise<{ puebloId?: string; puebloNombre?: string; tipo?: string; tematica?: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  const params = await searchParams;

  if (!params.puebloId) {
    redirect('/gestion/mis-pueblos');
  }

  const puebloId = Number(params.puebloId);

  if (Number.isNaN(puebloId) || puebloId <= 0) {
    redirect('/gestion/mis-pueblos');
  }

  let puebloNombre = `Pueblo #${puebloId}`;

  if (params.puebloNombre) {
    puebloNombre = decodeURIComponent(params.puebloNombre);
  } else if (me.rol === 'ALCALDE') {
    const misPueblos = await getMisPueblosServer();
    const pueblo = misPueblos.find((p) => p.id === puebloId);
    if (pueblo) puebloNombre = pueblo.nombre;
  }

  const contenidos = await fetchContenidosPueblo(puebloId);

  const noticias = contenidos.filter((c: any) => c.tipo === 'NOTICIA');
  const eventos = contenidos.filter((c: any) => c.tipo === 'EVENTO');
  const articulos = contenidos.filter((c: any) => c.tipo === 'ARTICULO');
  const paginas = contenidos.filter(
    (c: any) => c.tipo === 'PAGINA_TEMATICA' || String(c.id ?? '').startsWith('page-'),
  );

  const tematicaCounts: Record<string, { count: number; image: string | null; items: any[] }> = {};
  for (const cat of CATEGORIAS_TEMATICAS) {
    const catItems = paginas.filter((p: any) => p.categoria === cat.value);
    tematicaCounts[cat.value] = {
      count: catItems.length,
      image: getFirstImage(catItems),
      items: catItems,
    };
  }

  const selectedTematica = CATEGORIAS_TEMATICAS.some((c) => c.value === params.tematica)
    ? (params.tematica as string)
    : null;
  const selectedTematicaMeta = selectedTematica
    ? CATEGORIAS_TEMATICAS.find((c) => c.value === selectedTematica) ?? null
    : null;
  const paginasFiltradas = selectedTematica ? tematicaCounts[selectedTematica].items : paginas;

  const newBase = `/gestion/pueblo/contenidos/nuevo?puebloId=${puebloId}&puebloNombre=${encodeURIComponent(puebloNombre)}`;
  const listBase = `/gestion/pueblo/contenidos?puebloId=${puebloId}&puebloNombre=${encodeURIComponent(puebloNombre)}`;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Contenidos · {puebloNombre}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona las publicaciones de tu pueblo organizadas por tipo
          </p>
        </div>
        <Link
          className="rounded-lg border-0 bg-[#b5472a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#9e3d24] transition-colors"
          href={newBase}
        >
          + Nuevo contenido
        </Link>
      </div>

      <div className="space-y-6">
        {/* NOTICIAS */}
        <SectionCard
          title="Noticias"
          icon="📰"
          count={noticias.length}
          image={getFirstImage(noticias)}
          items={noticias}
          accentColor="from-blue-500 to-indigo-600"
          newHref={`${newBase}&tipo=NOTICIA`}
          newLabel="+ Noticia"
        />

        {/* EVENTOS */}
        <SectionCard
          title="Eventos"
          icon="📅"
          count={eventos.length}
          image={getFirstImage(eventos)}
          items={eventos}
          accentColor="from-rose-500 to-red-600"
          newHref={`${newBase}&tipo=EVENTO`}
          newLabel="+ Evento"
        />

        {/* ARTICULOS */}
        <SectionCard
          title="Artículos"
          icon="📝"
          count={articulos.length}
          image={getFirstImage(articulos)}
          items={articulos}
          accentColor="from-teal-500 to-cyan-600"
          newHref={`${newBase}&tipo=ARTICULO`}
          newLabel="+ Artículo"
        />

        {/* PAGINAS TEMATICAS */}
        <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🗂️</span>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Páginas temáticas</h2>
                  <p className="text-sm text-muted-foreground">
                    {paginas.length === 0
                      ? 'Crea páginas sobre gastronomía, naturaleza, cultura y más'
                      : `${paginas.length} ${paginas.length === 1 ? 'página creada' : 'páginas creadas'} · hasta 8 por categoría`}
                  </p>
                </div>
              </div>
              <Link
                href={`${newBase}&tipo=PAGINA`}
                className="rounded-lg bg-[#b5472a] px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#9e3d24] transition-colors whitespace-nowrap"
              >
                + Página
              </Link>
            </div>
          </div>

          <div className="border-t border-border px-5 py-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CATEGORIAS_TEMATICAS.map((cat) => (
                <TematicaCategoryCard
                  key={cat.value}
                  cat={cat}
                  count={tematicaCounts[cat.value].count}
                  image={tematicaCounts[cat.value].image}
                  puebloId={puebloId}
                  puebloNombre={puebloNombre}
                  filterHref={`${listBase}&tematica=${cat.value}#paginas-tematicas`}
                  isActive={selectedTematica === cat.value}
                />
              ))}
            </div>
          </div>

          {paginas.length > 0 && (
            <div id="paginas-tematicas" className="border-t border-border px-5 py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {selectedTematicaMeta
                    ? `Páginas de ${selectedTematicaMeta.label}`
                    : 'Todas las páginas temáticas'}
                </h3>
                {selectedTematica && (
                  <Link
                    href={`${listBase}#paginas-tematicas`}
                    className="text-xs font-medium text-[#b5472a] hover:underline"
                  >
                    Ver todas
                  </Link>
                )}
              </div>
              <ul className="space-y-3">
                {paginasFiltradas.slice(0, PREVIEW_COUNT).map((c: any) => (
                  <ContenidoItemPueblo key={c.id} contenido={c} />
                ))}
              </ul>

              {paginasFiltradas.length === 0 && selectedTematica && (
                <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                  Aún no hay páginas en esta categoría.
                </p>
              )}

              {paginasFiltradas.length > PREVIEW_COUNT && (
                <details className="mt-3 group">
                  <summary className="cursor-pointer select-none list-none flex items-center gap-2 rounded-lg border border-[#b5472a]/30 bg-[#b5472a]/5 px-4 py-2.5 text-sm font-semibold text-[#b5472a] hover:bg-[#b5472a]/10 transition-colors">
                    <svg className="h-4 w-4 transition-transform group-open:rotate-90" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                    Ver {paginasFiltradas.length - PREVIEW_COUNT} más ({paginasFiltradas.length} en total)
                  </summary>
                  <ul className="mt-3 space-y-3">
                    {paginasFiltradas.slice(PREVIEW_COUNT).map((c: any) => (
                      <ContenidoItemPueblo key={c.id} contenido={c} />
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href="/gestion">
          ← Volver
        </Link>
      </div>
    </main>
  );
}
