import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const API_BASE = getApiUrl();
  const upstream = await fetch(`${API_BASE}/notificaciones`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const text = await upstream.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}

  if (!upstream.ok) {
    return NextResponse.json(
      { message: 'Upstream error', status: upstream.status },
      { status: upstream.status }
    );
  }

  const items = Array.isArray(json) ? json : (json?.items ?? json?.data ?? []);
  
  const noticias = items.filter((n: any) => (n.tipo ?? n.type) === 'NOTICIA');

  return NextResponse.json(noticias, { status: upstream.status });
}

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const titulo = typeof body?.titulo === 'string' ? body.titulo.trim() : '';
  const contenido = typeof body?.contenido === 'string' ? body.contenido.trim() : '';

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
      contenido: contenido || null,
    }),
    cache: 'no-store',
  });

  const text = await upstream.text();

  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  return NextResponse.json(data, { status: upstream.status });
}





