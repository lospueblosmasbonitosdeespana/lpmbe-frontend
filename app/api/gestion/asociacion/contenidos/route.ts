import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}

// GET /api/gestion/asociacion/contenidos (listar)
export async function GET(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ items: [] }, { status: 200 });

  const API_BASE = getApiUrl();
  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();
  if (searchParams.get('limit')) params.set('limit', searchParams.get('limit')!);
  const queryString = params.toString() ? `?${params.toString()}` : '';

  const upstream = await fetch(`${API_BASE}/admin/contenidos${queryString}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// POST /api/gestion/asociacion/contenidos (crear)
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const API_BASE = getApiUrl();
  const body = await req.text();

  const upstream = await fetch(`${API_BASE}/admin/contenidos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
