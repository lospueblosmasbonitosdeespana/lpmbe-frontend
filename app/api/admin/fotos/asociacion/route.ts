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

function pushIfUrl(arr: PhotoEntry[], url: unknown, source: string, label: string, parentTitle: string, parentId: string | number) {
  const u = str(url);
  if (u && u.startsWith('http')) arr.push({ url: u, source, label, parentTitle: str(parentTitle) || '(sin título)', parentId });
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
  const pubH = { 'Content-Type': 'application/json' };
  const photos: PhotoEntry[] = [];

  const [mxData, contenidosData, noticiasData, eventosData] = await Promise.all([
    safeFetch(`${API}/wp-json/lpbe/v1/multiexperiencias-lite`, pubH),
    safeFetch(`${API}/admin/contenidos?scope=ASOCIACION&limit=200`, authH),
    safeFetch(`${API}/public/noticias?scope=ASOCIACION&limit=200`, pubH),
    safeFetch(`${API}/public/eventos?scope=ASOCIACION&limit=200`, pubH),
  ]);

  const mxList = Array.isArray(mxData) ? mxData : [];
  mxList.forEach((mx: any) => {
    pushIfUrl(photos, mx.foto || mx.imagen, 'MULTIEXPERIENCIA', mx.titulo || mx.nombre || 'MX', mx.titulo || mx.nombre, mx.id);
  });

  const contenidos = Array.isArray(contenidosData) ? contenidosData : (Array.isArray(contenidosData?.items) ? contenidosData.items : []);
  contenidos.forEach((c: any) => {
    const cover = str(c.coverUrl);
    if (cover && cover.startsWith('http')) {
      photos.push({ url: cover, source: 'CONTENIDO_PORTADA', label: `Portada: ${c.titulo || '(sin título)'}`, parentTitle: c.titulo || '', parentId: c.id });
    }
    const gallery = Array.isArray(c.galleryUrls) ? c.galleryUrls : [];
    gallery.forEach((g: string, idx: number) => {
      const gUrl = str(g);
      if (gUrl && gUrl.startsWith('http')) {
        photos.push({ url: gUrl, source: 'CONTENIDO_GALERIA', label: `Galería ${idx + 1}: ${c.titulo || '(sin título)'}`, parentTitle: c.titulo || '', parentId: c.id });
      }
    });
  });

  const noticias = Array.isArray(noticiasData) ? noticiasData : (Array.isArray(noticiasData?.items) ? noticiasData.items : []);
  noticias.forEach((n: any) => {
    pushIfUrl(photos, n.imagen, 'NOTICIA', n.titulo || 'Noticia', n.titulo, n.id);
  });

  const eventos = Array.isArray(eventosData) ? eventosData : (Array.isArray(eventosData?.items) ? eventosData.items : []);
  eventos.forEach((ev: any) => {
    pushIfUrl(photos, ev.imagen, 'EVENTO', ev.titulo || 'Evento', ev.titulo, ev.id);
  });

  const unique = new Map<string, PhotoEntry>();
  for (const p of photos) {
    if (!unique.has(p.url)) unique.set(p.url, p);
  }

  return NextResponse.json(Array.from(unique.values()));
}
