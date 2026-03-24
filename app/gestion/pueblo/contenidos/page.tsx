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

function SectionCard({
  title,
  icon,
  count,
  image,
  children,
  accentColor,
  newHref,
  newLabel,
}: {
  title: string;
  icon: string;
  count: number;
  image: string | null;
  children: React.ReactNode;
  accentColor: string;
  newHref: string;
  newLabel: string;
}) {
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
          <ul className="space-y-3">{children}</ul>
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
}: {
  cat: typeof CATEGORIAS_TEMATICAS[number];
  count: number;
  image: string | null;
  puebloId: number;
  puebloNombre: string;
}) {
  const maxPages = 4;
  const progress = Math.min(count / maxPages, 1) * 100;

  return (
    <div className="group relative rounded-lg border border-border bg-card overflow-hidden transition hover:shadow-md hover:border-primary/30">
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
          {count < maxPages && (
            <Link
              href={`/gestion/pueblo/contenidos/nuevo?puebloId=${puebloId}&puebloNombre=${encodeURIComponent(puebloNombre)}&tipo=PAGINA`}
              className="text-xs font-medium text-[#b5472a] hover:underline"
            >
              + Crear
            </Link>
          )}
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${cat.color} transition-all`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
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

  const newBase = `/gestion/pueblo/contenidos/nuevo?puebloId=${puebloId}&puebloNombre=${encodeURIComponent(puebloNombre)}`;

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
          accentColor="from-blue-500 to-indigo-600"
          newHref={`${newBase}&tipo=NOTICIA`}
          newLabel="+ Noticia"
        >
          {noticias.map((c: any) => (
            <ContenidoItemPueblo key={c.id} contenido={c} />
          ))}
        </SectionCard>

        {/* EVENTOS */}
        <SectionCard
          title="Eventos"
          icon="📅"
          count={eventos.length}
          image={getFirstImage(eventos)}
          accentColor="from-rose-500 to-red-600"
          newHref={`${newBase}&tipo=EVENTO`}
          newLabel="+ Evento"
        >
          {eventos.map((c: any) => (
            <ContenidoItemPueblo key={c.id} contenido={c} />
          ))}
        </SectionCard>

        {/* ARTICULOS */}
        <SectionCard
          title="Artículos"
          icon="📝"
          count={articulos.length}
          image={getFirstImage(articulos)}
          accentColor="from-teal-500 to-cyan-600"
          newHref={`${newBase}&tipo=ARTICULO`}
          newLabel="+ Artículo"
        >
          {articulos.map((c: any) => (
            <ContenidoItemPueblo key={c.id} contenido={c} />
          ))}
        </SectionCard>

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
                      : `${paginas.length} ${paginas.length === 1 ? 'página creada' : 'páginas creadas'} · hasta 4 por categoría`}
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
                />
              ))}
            </div>
          </div>

          {paginas.length > 0 && (
            <div className="border-t border-border px-5 py-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Todas las páginas temáticas</h3>
              <ul className="space-y-3">
                {paginas.map((c: any) => (
                  <ContenidoItemPueblo key={c.id} contenido={c} />
                ))}
              </ul>
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
