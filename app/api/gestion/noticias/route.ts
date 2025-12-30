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

  let puebloId: number;
  try {
    puebloId = await getPuebloIdBySlug(puebloSlug);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 404 });
  }

  const API_BASE = getApiUrl();
  
  // 🔥 CAMBIO: Usar el endpoint específico de noticias del pueblo
  const upstream = await fetch(`${API_BASE}/pueblos/${puebloId}/noticias`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    return NextResponse.json(
      { message: 'Error upstream', status: upstream.status },
      { status: upstream.status }
    );
  }

  const text = await upstream.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}

  const noticias = Array.isArray(json) ? json : (json?.items ?? json?.data ?? []);

  return NextResponse.json(noticias);
}

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const puebloSlug = body?.puebloSlug;
  const titulo = typeof body?.titulo === 'string' ? body.titulo.trim() : '';
  const contenido = typeof body?.contenido === 'string' ? body.contenido.trim() : '';

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
    
    // 1) Intento endpoint específico por pueblo
    const upstream1 = await fetch(`${API_BASE}/pueblos/${puebloId}/noticias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        titulo, 
        contenido,
        fecha,
      }),
      cache: 'no-store',
    });

    if (upstream1.status !== 404) {
      const text = await upstream1.text();
      
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { message: text };
      }
      
      return NextResponse.json(data, { status: upstream1.status });
    }

    // 2) Fallback a /notificaciones (igual que alertas)
    const upstream2 = await fetch(`${API_BASE}/notificaciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tipo: 'NOTICIA',
        puebloSlug,
        titulo,
        contenido: contenido || null,
      }),
      cache: 'no-store',
    });

    const text2 = await upstream2.text();

    let data2: any = {};
    try {
      data2 = text2 ? JSON.parse(text2) : {};
    } catch {
      data2 = { message: text2 };
    }

    return NextResponse.json(data2, { status: upstream2.status });
  } catch (e: any) {
    console.error('[NOTICIAS PUEBLO POST]', e);
    return NextResponse.json({ message: e?.message ?? 'Error obteniendo pueblo' }, { status: 500 });
  }
}





