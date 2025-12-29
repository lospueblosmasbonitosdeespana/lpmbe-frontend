import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const url = new URL(req.url);
  const puebloSlug = url.searchParams.get('puebloSlug');
  if (!puebloSlug) return NextResponse.json({ message: 'puebloSlug requerido' }, { status: 400 });

  const upstream = await fetch(`${API_BASE}/pueblos/${puebloSlug}/eventos`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = await upstream.json().catch(() => ([]));
  return NextResponse.json(data, { status: upstream.status });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const puebloSlug = body?.puebloSlug;

  const titulo = typeof body?.titulo === 'string' ? body.titulo.trim() : '';
  const descripcion = typeof body?.descripcion === 'string' ? body.descripcion.trim() : '';
  const fecha_inicio = body?.fecha_inicio ?? null;
  const fecha_fin = body?.fecha_fin ?? null;

  if (!puebloSlug) return NextResponse.json({ message: 'puebloSlug requerido' }, { status: 400 });
  if (!titulo) return NextResponse.json({ message: 'titulo requerido' }, { status: 400 });

  const upstream = await fetch(`${API_BASE}/pueblos/${puebloSlug}/eventos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ titulo, descripcion, fecha_inicio, fecha_fin }),
    cache: 'no-store',
  });

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}





