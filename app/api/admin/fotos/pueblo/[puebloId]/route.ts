import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const maxDuration = 60;

type PhotoEntry = {
  url: string;
  source: string;
  label: string;
  parentTitle: string;
  parentId: string | number;
};

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function extractUrl(item: unknown): string {
  if (typeof item === 'string') return item.trim();
  if (item && typeof item === 'object') {
    const o = item as Record<string, unknown>;
    for (const k of ['url', 'publicUrl', 'src', 'mediaUrl']) {
      if (typeof o[k] === 'string' && (o[k] as string).trim()) return (o[k] as string).trim();
    }
  }
  return '';
}

function valid(u: string): boolean {
  return u.startsWith('http://') || u.startsWith('https://');
}

function add(arr: PhotoEntry[], url: unknown, source: string, label: string, parentTitle: string, parentId: string | number) {
  const u = extractUrl(url);
  if (u && valid(u)) arr.push({ url: u, source, label, parentTitle: str(parentTitle) || '(sin título)', parentId });
}

function extractImgsFromHtml(html: string): string[] {
  if (!html) return [];
  const urls: string[] = [];
  const regex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1].trim();
    if (valid(url)) urls.push(url);
  }
  return urls;
}

async function safeFetch(url: string, headers: Record<string, string>): Promise<any> {
  try {
    const res = await fetch(url, { headers, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchAllContenidos(apiBase: string, headers: Record<string, string>, puebloId: number): Promise<any[]> {
  const all: any[] = [];
  const PAGE_SIZE = 100;
  for (let page = 1; page <= 20; page++) {
    const data = await safeFetch(`${apiBase}/admin/contenidos?puebloId=${puebloId}&limit=${PAGE_SIZE}&page=${page}`, headers);
    const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
    all.push(...items);
    const totalPages = data?.pages || 1;
    if (page >= totalPages || items.length < PAGE_SIZE) break;
  }
  return all;
}

export async function GET(req: Request, { params }: { params: Promise<{ puebloId: string }> }) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { puebloId: pidStr } = await params;
  const puebloId = Number(pidStr);
  if (!puebloId || Number.isNaN(puebloId)) {
    return NextResponse.json({ message: 'puebloId inválido' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug')?.trim() || '';

  const API = getApiUrl();
  const authH = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const pubH = { 'Content-Type': 'application/json' };
  const photos: PhotoEntry[] = [];

  const puebloUrl = slug
    ? `${API}/pueblos/${encodeURIComponent(slug)}`
    : `${API}/pueblos/${puebloId}`;

  const [puebloData, pagesData] = await Promise.all([
    safeFetch(puebloUrl, pubH),
    safeFetch(`${API}/admin/pueblos/${puebloId}/pages`, authH),
  ]);

  const pNombre = str(puebloData?.nombre) || `Pueblo ${puebloId}`;

  // IDs de multiexperiencias para luego pedir paradas
  const mxIds: { id: number; titulo: string }[] = [];

  if (puebloData) {
    // 1) Galería del pueblo
    const fotosPueblo = Array.isArray(puebloData.fotosPueblo) ? puebloData.fotosPueblo : [];
    fotosPueblo.forEach((f: any, idx: number) => {
      const u = extractUrl(f);
      if (u && valid(u)) photos.push({
        url: u, source: 'GALERIA_PUEBLO', label: `Galería #${idx + 1}`, parentTitle: pNombre, parentId: puebloId,
      });
    });

    add(photos, puebloData.foto_destacada, 'GALERIA_PUEBLO', 'Foto destacada', pNombre, puebloId);
    add(photos, puebloData.escudo_bandera, 'GALERIA_PUEBLO', 'Escudo / bandera', pNombre, puebloId);

    if (fotosPueblo.length === 0) {
      const fotos = Array.isArray(puebloData.fotos) ? puebloData.fotos : [];
      fotos.forEach((f: any, idx: number) => {
        const u = extractUrl(f);
        if (u && valid(u)) photos.push({
          url: u, source: 'GALERIA_PUEBLO', label: `Galería #${idx + 1}`, parentTitle: pNombre, parentId: puebloId,
        });
      });
    }

    // 2) POIs
    const pois = Array.isArray(puebloData.pois) ? puebloData.pois : [];
    pois.forEach((poi: any) => {
      add(photos, poi.foto, 'POI', poi.nombre || 'Punto de interés', poi.nombre, poi.id);
    });

    // 3) Multiexperiencias — foto padre + recoger IDs para paradas
    const mxs = Array.isArray(puebloData.multiexperiencias) ? puebloData.multiexperiencias : [];
    mxs.forEach((pm: any) => {
      const mx = pm.multiexperiencia || pm;
      const titulo = mx.titulo || mx.nombre || 'Multiexperiencia';
      add(photos, mx.foto, 'MULTIEXPERIENCIA', titulo, titulo, mx.id);
      if (mx.id) mxIds.push({ id: mx.id, titulo });
    });
  }

  // 3b) Paradas de cada multiexperiencia (en paralelo)
  if (mxIds.length > 0) {
    const paradasResults = await Promise.all(
      mxIds.map((mx) => safeFetch(`${API}/multiexperiencias/${mx.id}/paradas`, pubH)),
    );
    paradasResults.forEach((paradas, i) => {
      const list = Array.isArray(paradas) ? paradas : [];
      const mxTitulo = mxIds[i].titulo;
      list.forEach((p: any) => {
        if (p.foto) {
          add(photos, p.foto, 'MULTIEXPERIENCIA', `${mxTitulo} → ${p.titulo || 'Parada'}`, mxTitulo, p.overrideId || p.customId || p.legacyLugarId || 0);
        }
      });
    });
  }

  // 4) Contenidos admin paginados (noticias, eventos, artículos)
  const contenidos = await fetchAllContenidos(API, authH, puebloId);
  contenidos.forEach((c: any) => {
    const tipo = str(c.tipo).toUpperCase();
    const tipoLabel = tipo === 'EVENTO' ? 'Evento' : tipo === 'NOTICIA' ? 'Noticia' : tipo === 'ARTICULO' ? 'Artículo' : 'Contenido';
    add(photos, c.coverUrl, 'CONTENIDO', `${tipoLabel}: ${c.titulo || '(sin título)'}`, c.titulo, c.id);
    const gallery = Array.isArray(c.galleryUrls) ? c.galleryUrls : [];
    gallery.forEach((g: string, idx: number) => {
      add(photos, g, 'CONTENIDO', `${tipoLabel} gal. ${idx + 1}: ${c.titulo || ''}`, c.titulo, c.id);
    });
    const bodyImgs = extractImgsFromHtml(str(c.contenidoMd));
    bodyImgs.forEach((imgUrl, idx) => {
      add(photos, imgUrl, 'CONTENIDO', `${tipoLabel} img. cuerpo ${idx + 1}: ${c.titulo || ''}`, c.titulo, c.id);
    });
  });

  // 5) Páginas temáticas
  if (pagesData && typeof pagesData === 'object') {
    const categories = Array.isArray(pagesData) ? pagesData : Object.values(pagesData);
    for (const catGroup of categories) {
      const pages = Array.isArray(catGroup) ? catGroup
        : (Array.isArray(catGroup?.pages) ? catGroup.pages : (catGroup?.items ? catGroup.items : []));
      for (const p of (Array.isArray(pages) ? pages : [])) {
        add(photos, p.coverUrl, 'PAGINA_TEMATICA', `Pág. temática: ${p.titulo || p.title || '(sin título)'}`, p.titulo || p.title, p.id);
        const gallery = Array.isArray(p.galleryUrls) ? p.galleryUrls : [];
        gallery.forEach((g: string, idx: number) => {
          add(photos, g, 'PAGINA_TEMATICA', `Pág. temática gal. ${idx + 1}: ${p.titulo || p.title || ''}`, p.titulo || p.title, p.id);
        });
      }
    }
  }

  const unique = new Map<string, PhotoEntry>();
  for (const p of photos) {
    if (!unique.has(p.url)) unique.set(p.url, p);
  }

  return NextResponse.json(Array.from(unique.values()));
}
