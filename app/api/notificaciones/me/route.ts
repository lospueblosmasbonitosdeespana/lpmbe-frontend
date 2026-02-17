import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const API_BASE = getApiUrl();
  
  // Leer query params (lang para traducción de semáforos en el feed del usuario)
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit');
  const lang = searchParams.get('lang');
  const params = new URLSearchParams();
  if (limit) params.set('limit', limit);
  if (lang) params.set('lang', lang);
  const queryString = params.toString() ? `?${params.toString()}` : '';

  // Intentar /notificaciones/me primero, luego /notificaciones como fallback
  let upstream = await fetch(`${API_BASE}/notificaciones/me${queryString}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  // Si /me no existe, usar /notificaciones
  if (upstream.status === 404) {
    upstream = await fetch(`${API_BASE}/notificaciones${queryString}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
    },
  });
}






















