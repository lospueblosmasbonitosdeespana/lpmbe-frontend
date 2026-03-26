import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getMeServer } from '@/lib/me';
import { getPueblosLite } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const revalidate = 0;

type ScopeFilter = 'PUEBLO' | 'ASOCIACION';
type SourceFilter = 'ALL' | 'COVER' | 'GALLERY';
type TipoFilter = 'ALL' | 'NOTICIA' | 'EVENTO' | 'ARTICULO' | 'PAGINA_TEMATICA';

type RawContenido = {
  id: number | string;
  tipo?: string;
  titulo?: string;
  coverUrl?: string | null;
  galleryUrls?: string[];
  categoria?: string;
  pueblo?: { id?: number; nombre?: string };
  createdAt?: string;
  updatedAt?: string;
};

type PhotoItem = {
  key: string;
  url: string;
  source: 'COVER' | 'GALLERY';
  tipo: 'NOTICIA' | 'EVENTO' | 'ARTICULO' | 'PAGINA_TEMATICA';
  titulo: string;
  puebloNombre: string;
  createdAt: string | null;
  filename: string;
};

function normalizeTipo(c: RawContenido): PhotoItem['tipo'] {
  if (c.tipo === 'NOTICIA' || c.tipo === 'EVENTO' || c.tipo === 'ARTICULO') return c.tipo;
  if (String(c.id ?? '').startsWith('page-') || c.tipo === 'PAGINA_TEMATICA' || c.tipo === 'PAGINA') return 'PAGINA_TEMATICA';
  return 'ARTICULO';
}

function normalizeTitle(c: RawContenido): string {
  const t = String(c.titulo || '').trim();
  return t || '(sin título)';
}

function buildFilename(
  scope: ScopeFilter,
  puebloNombre: string,
  tipo: PhotoItem['tipo'],
  id: string | number,
  source: 'COVER' | 'GALLERY',
  idx: number,
): string {
  const pueblo = puebloNombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${scope.toLowerCase()}-${pueblo || 'sin-pueblo'}-${tipo.toLowerCase()}-${id}-${source.toLowerCase()}-${idx + 1}.jpg`;
}

function extractPhotoItems(scope: ScopeFilter, puebloNombre: string, contenidos: RawContenido[]): PhotoItem[] {
  const out: PhotoItem[] = [];
  for (const c of contenidos) {
    const tipo = normalizeTipo(c);
    const titulo = normalizeTitle(c);
    const id = String(c.id ?? 'na');
    const createdAt = c.updatedAt || c.createdAt || null;
    const cover = String(c.coverUrl || '').trim();
    if (cover) {
      out.push({
        key: `${scope}-${id}-cover`,
        url: cover,
        source: 'COVER',
        tipo,
        titulo,
        puebloNombre,
        createdAt,
        filename: buildFilename(scope, puebloNombre, tipo, id, 'COVER', 0),
      });
    }
    const gallery = Array.isArray(c.galleryUrls) ? c.galleryUrls : [];
    gallery
      .map((u) => String(u || '').trim())
      .filter(Boolean)
      .forEach((url, idx) => {
        out.push({
          key: `${scope}-${id}-gallery-${idx}`,
          url,
          source: 'GALLERY',
          tipo,
          titulo,
          puebloNombre,
          createdAt,
          filename: buildFilename(scope, puebloNombre, tipo, id, 'GALLERY', idx),
        });
      });
  }
  return out;
}

async function fetchContenidosPueblo(puebloId: number): Promise<RawContenido[]> {
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const baseUrl = `${proto}://${host}`;
  const params = new URLSearchParams();
  params.set('puebloId', String(puebloId));
  params.set('limit', '200');
  const res = await fetch(`${baseUrl}/api/gestion/pueblo/contenidos?${params.toString()}`, {
    cache: 'no-store',
    headers: { cookie: h.get('cookie') ?? '' },
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
}

async function fetchContenidosAsociacion(): Promise<RawContenido[]> {
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const baseUrl = `${proto}://${host}`;
  const params = new URLSearchParams();
  params.set('limit', '200');
  const res = await fetch(`${baseUrl}/api/gestion/asociacion/contenidos?${params.toString()}`, {
    cache: 'no-store',
    headers: { cookie: h.get('cookie') ?? '' },
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => []);
  return Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
}

export default async function GestionAsociacionFotosPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; puebloId?: string; source?: string; tipo?: string }>;
}) {
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ADMIN' && me.rol !== 'EDITOR') redirect('/mi-cuenta');

  const params = await searchParams;
  const scope: ScopeFilter = params.scope === 'ASOCIACION' ? 'ASOCIACION' : 'PUEBLO';
  const sourceFilter: SourceFilter = params.source === 'COVER' || params.source === 'GALLERY' ? params.source : 'ALL';
  const tipoFilter: TipoFilter =
    params.tipo === 'NOTICIA' || params.tipo === 'EVENTO' || params.tipo === 'ARTICULO' || params.tipo === 'PAGINA_TEMATICA'
      ? params.tipo
      : 'ALL';
  const puebloId = Number(params.puebloId || 0);

  const pueblos = (await getPueblosLite()).filter((p) => p.id !== 200);
  const selectedPueblo = pueblos.find((p) => p.id === puebloId) || null;

  let photoItems: PhotoItem[] = [];
  if (scope === 'ASOCIACION') {
    const asocContenidos = await fetchContenidosAsociacion();
    photoItems = extractPhotoItems('ASOCIACION', 'Asociación', asocContenidos);
  } else if (selectedPueblo) {
    const puebloContenidos = await fetchContenidosPueblo(selectedPueblo.id);
    photoItems = extractPhotoItems('PUEBLO', selectedPueblo.nombre, puebloContenidos);
  }

  const filtered = photoItems
    .filter((p) => sourceFilter === 'ALL' || p.source === sourceFilter)
    .filter((p) => tipoFilter === 'ALL' || p.tipo === tipoFilter)
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold">Fotos · Gestión Asociación (Fase 1)</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Biblioteca inicial de imágenes desde contenidos (portadas y galerías) para descarga rápida.
      </p>

      <form method="GET" className="mt-6 grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs text-muted-foreground">
          Ámbito
          <select name="scope" defaultValue={scope} className="mt-1 w-full rounded-md border px-2 py-2 text-sm">
            <option value="PUEBLO">Pueblos</option>
            <option value="ASOCIACION">Asociación</option>
          </select>
        </label>

        <label className="text-xs text-muted-foreground">
          Pueblo
          <select name="puebloId" defaultValue={selectedPueblo?.id || ''} className="mt-1 w-full rounded-md border px-2 py-2 text-sm">
            <option value="">Selecciona un pueblo…</option>
            {pueblos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-muted-foreground">
          Fuente imagen
          <select name="source" defaultValue={sourceFilter} className="mt-1 w-full rounded-md border px-2 py-2 text-sm">
            <option value="ALL">Todas</option>
            <option value="COVER">Portadas</option>
            <option value="GALLERY">Galerías</option>
          </select>
        </label>

        <label className="text-xs text-muted-foreground">
          Tipo contenido
          <select name="tipo" defaultValue={tipoFilter} className="mt-1 w-full rounded-md border px-2 py-2 text-sm">
            <option value="ALL">Todos</option>
            <option value="NOTICIA">Noticias</option>
            <option value="EVENTO">Eventos</option>
            <option value="ARTICULO">Artículos</option>
            <option value="PAGINA_TEMATICA">Páginas temáticas</option>
          </select>
        </label>

        <div className="flex items-end gap-2">
          <button type="submit" className="w-full rounded-md bg-[#b5472a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9e3d24]">
            Aplicar filtros
          </button>
        </div>
      </form>

      <div className="mt-4 text-sm text-muted-foreground">
        {scope === 'PUEBLO' && !selectedPueblo
          ? 'Selecciona un pueblo para ver sus fotos.'
          : `${filtered.length} imagen${filtered.length === 1 ? '' : 'es'} encontrada${filtered.length === 1 ? '' : 's'}.`}
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((img) => (
            <article key={img.key} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.titulo} className="h-44 w-full bg-gray-100 object-cover" />
              <div className="space-y-2 p-3">
                <p className="line-clamp-2 text-sm font-semibold">{img.titulo}</p>
                <p className="text-xs text-muted-foreground">
                  {img.puebloNombre} · {img.tipo} · {img.source === 'COVER' ? 'Portada' : 'Galería'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded border px-2 py-1.5 text-center text-xs font-medium hover:bg-gray-50"
                  >
                    Ver
                  </a>
                  <a
                    href={`/api/admin/media/download?url=${encodeURIComponent(img.url)}&filename=${encodeURIComponent(img.filename)}`}
                    className="rounded border border-[#b5472a]/30 bg-[#b5472a]/5 px-2 py-1.5 text-center text-xs font-semibold text-[#b5472a] hover:bg-[#b5472a]/10"
                  >
                    Descargar
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-8 text-sm">
        <Link className="hover:underline" href="/gestion/asociacion">
          ← Volver
        </Link>
      </div>
    </main>
  );
}

