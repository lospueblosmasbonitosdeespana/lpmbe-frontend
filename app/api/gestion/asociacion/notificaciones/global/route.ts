import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}

/**
 * GET /api/gestion/asociacion/notificaciones/global
 * Lista todas las notificaciones globales (sin puebloId)
 * Proxy a backend GET /admin/notificaciones/global
 */
export async function GET(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get('tipo') ?? '';
  const limit = searchParams.get('limit') ?? '200';

  const API_BASE = getApiUrl();
  const params = new URLSearchParams();
  if (tipo) params.set('tipo', tipo);
  params.set('limit', limit);

  const upstream = await fetch(
    `${API_BASE}/admin/notificaciones/global?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    }
  );

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
