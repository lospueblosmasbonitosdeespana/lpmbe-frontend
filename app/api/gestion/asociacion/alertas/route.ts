import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const upstream = await fetch(`${API_BASE}/notificaciones`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = await upstream.json().catch(() => []);
  const list = Array.isArray(data) ? data : [];
  const alertas = list.filter((n: any) => (n.tipo ?? n.type) === 'ALERTA');

  return NextResponse.json(alertas, { status: upstream.status });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const titulo = typeof body?.titulo === 'string' ? body.titulo.trim() : '';
  const contenido = typeof body?.contenido === 'string' ? body.contenido.trim() : '';

  if (!titulo) return NextResponse.json({ message: 'titulo requerido' }, { status: 400 });

  const upstream = await fetch(`${API_BASE}/notificaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tipo: 'ALERTA',
      titulo,
      contenido: contenido || null,
    }),
    cache: 'no-store',
  });

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}





