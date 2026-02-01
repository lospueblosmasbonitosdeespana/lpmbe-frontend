import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}

async function getPuebloIdBySlug(slug: string): Promise<number> {
  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/pueblos/${slug}`, {
    cache: 'no-store',
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Error obteniendo pueblo (slug=${slug}): ${res.status} ${text.slice(0, 200)}`);
  }
  
  const pueblo = await res.json();
  if (!pueblo?.id) {
    throw new Error(`Pueblo no encontrado o sin ID (slug=${slug})`);
  }
  
  return pueblo.id;
}

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const url = new URL(req.url);
  const puebloSlug = url.searchParams.get('puebloSlug');
  if (!puebloSlug) return NextResponse.json({ message: 'puebloSlug requerido' }, { status: 400 });

  try {
    const puebloId = await getPuebloIdBySlug(puebloSlug);
    const API_BASE = getApiUrl();
    
    const upstream = await fetch(`${API_BASE}/pueblos/${puebloId}/noticias`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const text = await upstream.text();
    let data: any = [];
    try {
      data = text ? JSON.parse(text) : [];
    } catch {}

    if (!upstream.ok) {
      console.log('[NOTICIAS PUEBLO GET] error', upstream.status, text.slice(0, 500));
    }

    return NextResponse.json(Array.isArray(data) ? data : data.items ?? data.data ?? [], { 
      status: upstream.status 
    });
  } catch (e: any) {
    console.error('[NOTICIAS PUEBLO GET]', e);
    return NextResponse.json({ message: e?.message ?? 'Error obteniendo pueblo' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const puebloSlug = body?.puebloSlug;
  const titulo = typeof body?.titulo === 'string' ? body.titulo.trim() : '';
  const contenido = typeof body?.contenido === 'string' ? body.contenido.trim() : '';
  const imagen = typeof body?.imagen === 'string' ? body.imagen.trim() || null : null;

  if (!puebloSlug) return NextResponse.json({ message: 'puebloSlug requerido' }, { status: 400 });
  if (!titulo) return NextResponse.json({ message: 'titulo requerido' }, { status: 400 });
  if (!contenido || contenido.trim() === '') {
    return NextResponse.json({ message: 'contenido requerido' }, { status: 400 });
  }

  try {
    const puebloId = await getPuebloIdBySlug(puebloSlug);
    const API_BASE = getApiUrl();
    
    // El DTO requiere fecha (ISO) y contenido (string)
    const fecha = new Date().toISOString();
    
    const payload: Record<string, unknown> = { titulo, contenido, fecha };
    if (imagen) payload.imagen = imagen;
    
    const upstream = await fetch(`${API_BASE}/pueblos/${puebloId}/noticias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const text = await upstream.text();
    console.log('[NOTICIAS PUEBLO POST] status', upstream.status);
    console.log('[NOTICIAS PUEBLO POST] body', text.slice(0, 500));
    console.log('[NOTICIAS PUEBLO POST] payload', { titulo, contenido, fecha, puebloId, imagen: imagen ?? '(ninguna)' });

    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (e: any) {
    console.error('[NOTICIAS PUEBLO POST]', e);
    return NextResponse.json({ message: e?.message ?? 'Error obteniendo pueblo' }, { status: 500 });
  }
}





