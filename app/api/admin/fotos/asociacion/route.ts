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

function ok(u: string): boolean {
  return u.startsWith('http://') || u.startsWith('https://');
}

function push(arr: PhotoEntry[], url: unknown, source: string, label: string, parentTitle: string, parentId: string | number) {
  const u = str(url);
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

export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const API = getApiUrl();
  const authH = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const photos: PhotoEntry[] = [];

  // GET /admin/contenidos sin puebloId → admin ve TODOS (globales + pueblos).
  // Filtramos los que no tienen puebloId (= asociación).
  // GET /admin/asociacion/pages → páginas temáticas de la asociación.
  const [contenidosData, pagesData] = await Promise.all([
    safeFetch(`${API}/admin/contenidos?limit=500`, authH),
    safeFetch(`${API}/admin/asociacion/pages`, authH),
  ]);

  const contenidos = Array.isArray(contenidosData) ? contenidosData
    : (Array.isArray(contenidosData?.items) ? contenidosData.items : []);

  // Solo contenidos de la asociación (sin pueblo)
  const asocContenidos = contenidos.filter((c: any) => !c.puebloId && c.pueblo == null);
  asocContenidos.forEach((c: any) => {
    const tipo = str(c.tipo).toUpperCase();
    const tipoLabel = tipo === 'EVENTO' ? 'Evento' : tipo === 'NOTICIA' ? 'Noticia' : tipo === 'ARTICULO' ? 'Artículo' : 'Contenido';
    push(photos, c.coverUrl, 'CONTENIDO', `${tipoLabel}: ${c.titulo || '(sin título)'}`, c.titulo, c.id);
    const gallery = Array.isArray(c.galleryUrls) ? c.galleryUrls : [];
    gallery.forEach((g: string, idx: number) => {
      push(photos, g, 'CONTENIDO', `${tipoLabel} galería ${idx + 1}: ${c.titulo || '(sin título)'}`, c.titulo, c.id);
    });
  });

  // Páginas temáticas de la asociación
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
