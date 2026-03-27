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

function ok(u: string): boolean {
  return u.startsWith('http://') || u.startsWith('https://');
}

function push(arr: PhotoEntry[], url: unknown, source: string, label: string, parentTitle: string, parentId: string | number) {
  const u = extractUrl(url);
  if (u && ok(u)) arr.push({ url: u, source, label, parentTitle: str(parentTitle) || '(sin título)', parentId });
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

  // El endpoint público /pueblos/{slug} devuelve fotosPueblo, pois con foto,
  // multiexperiencias con foto, eventos, noticias. Con ID numérico no devuelve
  // fotosPueblo, por eso necesitamos el slug.
  const puebloUrl = slug
    ? `${API}/pueblos/${encodeURIComponent(slug)}`
    : `${API}/pueblos/${puebloId}`;

  const [puebloData, contenidosData, pagesData] = await Promise.all([
    safeFetch(puebloUrl, pubH),
    safeFetch(`${API}/admin/contenidos?puebloId=${puebloId}&limit=500`, authH),
    safeFetch(`${API}/admin/pueblos/${puebloId}/pages`, authH),
  ]);

  const pNombre = str(puebloData?.nombre) || `Pueblo ${puebloId}`;

  if (puebloData) {
    // 1) Galería del pueblo — viene de fotosPueblo (endpoint por slug)
    const fotosPueblo = Array.isArray(puebloData.fotosPueblo) ? puebloData.fotosPueblo : [];
    fotosPueblo.forEach((f: any, idx: number) => {
      const u = extractUrl(f);
      if (u && ok(u)) photos.push({
        url: u, source: 'GALERIA_PUEBLO', label: `Galería del pueblo #${idx + 1}`, parentTitle: pNombre, parentId: puebloId,
      });
    });

    // foto_destacada y escudo (campos escalares del modelo)
    push(photos, puebloData.foto_destacada, 'GALERIA_PUEBLO', 'Foto destacada', pNombre, puebloId);
    push(photos, puebloData.escudo_bandera, 'GALERIA_PUEBLO', 'Escudo / bandera', pNombre, puebloId);

    // Si no hay fotosPueblo, intentar fotos[] (endpoint por ID numérico)
    if (fotosPueblo.length === 0) {
      const fotos = Array.isArray(puebloData.fotos) ? puebloData.fotos : [];
      fotos.forEach((f: any, idx: number) => {
        const u = extractUrl(f);
        if (u && ok(u)) photos.push({
          url: u, source: 'GALERIA_PUEBLO', label: `Galería del pueblo #${idx + 1}`, parentTitle: pNombre, parentId: puebloId,
        });
      });
    }

    // 2) POIs — cada uno lleva foto (string URL)
    const pois = Array.isArray(puebloData.pois) ? puebloData.pois : [];
    pois.forEach((poi: any) => {
      push(photos, poi.foto, 'POI', poi.nombre || 'Punto de interés', poi.nombre, poi.id);
    });

    // 3) Multiexperiencias — cada PuebloMultiexperiencia tiene .multiexperiencia.foto
    const mxs = Array.isArray(puebloData.multiexperiencias) ? puebloData.multiexperiencias : [];
    mxs.forEach((pm: any) => {
      const mx = pm.multiexperiencia || pm;
      push(photos, mx.foto, 'MULTIEXPERIENCIA', mx.titulo || mx.nombre || 'Multiexperiencia', mx.titulo || mx.nombre, mx.id);
    });
  }

  // 4) Contenidos creados vía admin (noticias, eventos, artículos)
  const contenidos = Array.isArray(contenidosData) ? contenidosData : (Array.isArray(contenidosData?.items) ? contenidosData.items : []);
  contenidos.forEach((c: any) => {
    const tipo = str(c.tipo).toUpperCase();
    const tipoLabel = tipo === 'EVENTO' ? 'Evento' : tipo === 'NOTICIA' ? 'Noticia' : tipo === 'ARTICULO' ? 'Artículo' : 'Contenido';
    push(photos, c.coverUrl, 'CONTENIDO', `${tipoLabel}: ${c.titulo || '(sin título)'}`, c.titulo, c.id);
    const gallery = Array.isArray(c.galleryUrls) ? c.galleryUrls : [];
    gallery.forEach((g: string, idx: number) => {
      push(photos, g, 'CONTENIDO', `${tipoLabel} galería ${idx + 1}: ${c.titulo || '(sin título)'}`, c.titulo, c.id);
    });
  });

  // 5) Páginas temáticas vía admin
  if (pagesData && typeof pagesData === 'object') {
    const categories = Array.isArray(pagesData) ? pagesData : Object.values(pagesData);
    for (const catGroup of categories) {
      const pages = Array.isArray(catGroup) ? catGroup
        : (Array.isArray(catGroup?.pages) ? catGroup.pages : (catGroup?.items ? catGroup.items : []));
      for (const p of (Array.isArray(pages) ? pages : [])) {
        push(photos, p.coverUrl, 'PAGINA_TEMATICA', `Pág. temática: ${p.titulo || p.title || '(sin título)'}`, p.titulo || p.title, p.id);
        const gallery = Array.isArray(p.galleryUrls) ? p.galleryUrls : [];
        gallery.forEach((g: string, idx: number) => {
          push(photos, g, 'PAGINA_TEMATICA', `Pág. temática galería ${idx + 1}: ${p.titulo || p.title || ''}`, p.titulo || p.title, p.id);
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
