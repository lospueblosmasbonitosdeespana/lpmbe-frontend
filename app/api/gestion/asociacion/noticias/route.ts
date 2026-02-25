import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ items: [] }, { status: 200 });

  const API_BASE = getApiUrl();
  const url = `${API_BASE}/admin/notificaciones/global?tipo=NOTICIA&limit=200`;

  const upstream = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
  });
}

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const titulo = typeof body?.titulo === 'string' ? body.titulo.trim() : '';
  const contenido = typeof body?.contenido === 'string' ? body.contenido.trim() : '';
  const resumen = typeof body?.resumen === 'string' ? body.resumen.trim() : null;
  const coverUrl = typeof body?.coverUrl === 'string' ? body.coverUrl.trim() : null;

  if (!titulo) return NextResponse.json({ message: 'titulo requerido' }, { status: 400 });

  const API_BASE = getApiUrl();
  const upstream = await fetch(`${API_BASE}/notificaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tipo: 'NOTICIA',
      titulo,
      resumen: resumen || null,
      contenido: contenido || null,
      coverUrl: coverUrl || null,
    }),
    cache: 'no-store',
  });

  const text = await upstream.text();
  console.log('[NOTICIAS GLOBALES POST] status', upstream.status);
  console.log('[NOTICIAS GLOBALES POST] body', text.slice(0, 500));

  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  return NextResponse.json(data, { status: upstream.status });
}





