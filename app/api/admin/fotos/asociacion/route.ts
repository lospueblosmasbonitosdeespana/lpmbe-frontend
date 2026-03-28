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

function valid(u: string): boolean {
  return u.startsWith('http://') || u.startsWith('https://');
}

function add(arr: PhotoEntry[], url: unknown, source: string, label: string, parentTitle: string, parentId: string | number) {
  const u = str(url);
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

async function fetchAllContenidosAdmin(apiBase: string, headers: Record<string, string>): Promise<any[]> {
  const all: any[] = [];
  const PAGE_SIZE = 100;
  for (let page = 1; page <= 20; page++) {
    const data = await safeFetch(`${apiBase}/admin/contenidos?limit=${PAGE_SIZE}&page=${page}`, headers);
    const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
    all.push(...items);
    const totalPages = data?.pages || 1;
    if (page >= totalPages || items.length < PAGE_SIZE) break;
  }
  return all;
}

export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const API = getApiUrl();
  const authH = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const photos: PhotoEntry[] = [];

  const [allContenidos, pagesData] = await Promise.all([
    fetchAllContenidosAdmin(API, authH),
    safeFetch(`${API}/admin/asociacion/pages`, authH),
  ]);

  // Contenidos de la asociación = los que NO tienen puebloId
  const asocContenidos = allContenidos.filter((c: any) => !c.puebloId && !c.pueblo);
  asocContenidos.forEach((c: any) => {
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

  // Páginas temáticas de la asociación
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
