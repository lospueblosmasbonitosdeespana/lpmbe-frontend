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

async function safeFetch(url: string, headers: Record<string, string>): Promise<any> {
  try {
    const res = await fetch(url, { headers, cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ puebloId: string }> }) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { puebloId: pidStr } = await params;
  const puebloId = Number(pidStr);
  if (!puebloId || Number.isNaN(puebloId)) {
    return NextResponse.json({ message: 'puebloId inválido' }, { status: 400 });
  }

  const API = getApiUrl();
  const authH = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const pubH = { 'Content-Type': 'application/json' };
  const photos: PhotoEntry[] = [];

  const [puebloData, poisData, mxData, eventosData, noticiasData, contenidosData] = await Promise.all([
    safeFetch(`${API}/pueblos/${puebloId}`, pubH),
    safeFetch(`${API}/pois?puebloId=${puebloId}&limit=500`, pubH),
    safeFetch(`${API}/wp-json/lpbe/v1/multiexperiencias-lite-pueblo?puebloId=${puebloId}`, pubH),
    safeFetch(`${API}/public/eventos?puebloId=${puebloId}&limit=200`, pubH),
    safeFetch(`${API}/public/noticias?puebloId=${puebloId}&limit=200`, pubH),
    safeFetch(`${API}/admin/contenidos?puebloId=${puebloId}&limit=200`, authH),
  ]);

  if (puebloData) {
    pushIfUrl(photos, puebloData.foto_destacada, 'PUEBLO', 'Foto destacada', puebloData.nombre, puebloId);
    pushIfUrl(photos, puebloData.escudo_bandera, 'PUEBLO', 'Escudo/bandera', puebloData.nombre, puebloId);

    const fotos = Array.isArray(puebloData.fotos) ? puebloData.fotos
      : Array.isArray(puebloData.fotosPueblo) ? puebloData.fotosPueblo
      : [];
    fotos.forEach((f: any, idx: number) => {
      const u = extractUrl(f);
      if (u && u.startsWith('http')) photos.push({ url: u, source: 'GALERIA_PUEBLO', label: `Galería pueblo #${idx + 1}`, parentTitle: puebloData.nombre || '', parentId: puebloId });
    });
  }

  const pois = Array.isArray(poisData) ? poisData : (Array.isArray(poisData?.items) ? poisData.items : []);
  pois.forEach((poi: any) => {
    pushIfUrl(photos, poi.foto, 'POI', poi.nombre || 'POI', poi.nombre, poi.id);
    const poiFotos = Array.isArray(poi.fotos) ? poi.fotos : (Array.isArray(poi.fotosPoi) ? poi.fotosPoi : []);
    poiFotos.forEach((f: any, idx: number) => {
      const u = extractUrl(f);
      if (u && u.startsWith('http')) photos.push({ url: u, source: 'POI', label: `${poi.nombre || 'POI'} #${idx + 1}`, parentTitle: poi.nombre || '', parentId: poi.id });
    });
  });

  const mxList = Array.isArray(mxData) ? mxData : (Array.isArray(mxData?.items) ? mxData.items : []);
  mxList.forEach((mx: any) => {
    pushIfUrl(photos, mx.foto || mx.imagen, 'MULTIEXPERIENCIA', mx.titulo || mx.nombre || 'MX', mx.titulo || mx.nombre, mx.id);
  });

  const eventos = Array.isArray(eventosData) ? eventosData : (Array.isArray(eventosData?.items) ? eventosData.items : []);
  eventos.forEach((ev: any) => {
    pushIfUrl(photos, ev.imagen, 'EVENTO', ev.titulo || 'Evento', ev.titulo, ev.id);
  });

  const noticias = Array.isArray(noticiasData) ? noticiasData : (Array.isArray(noticiasData?.items) ? noticiasData.items : []);
  noticias.forEach((n: any) => {
    pushIfUrl(photos, n.imagen, 'NOTICIA', n.titulo || 'Noticia', n.titulo, n.id);
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

  const unique = new Map<string, PhotoEntry>();
  for (const p of photos) {
    if (!unique.has(p.url)) unique.set(p.url, p);
  }

  return NextResponse.json(Array.from(unique.values()));
}
