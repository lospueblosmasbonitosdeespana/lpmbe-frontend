import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET() {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const API_BASE = getApiUrl();
  // TODO: Reemplazar con la ruta real del backend cuando se descubra
  // Candidatos: /suscripciones, /notificaciones/suscripciones, /usuarios/me/suscripciones
  const upstream = await fetch(`${API_BASE}/suscripciones`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
    },
  });
}

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.puebloId !== 'number' ||
    typeof body.tipo !== 'string' ||
    typeof body.enabled !== 'boolean'
  ) {
    return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  }

  const API_BASE = getApiUrl();
  // TODO: Reemplazar con la ruta real del backend cuando se descubra
  // Candidatos: /suscripciones, /notificaciones/suscripciones, /usuarios/me/suscripciones
  const upstream = await fetch(`${API_BASE}/suscripciones`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify(body),
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
    },
  });
}










