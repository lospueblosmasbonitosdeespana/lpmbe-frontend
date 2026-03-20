import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/admin/home`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    return new NextResponse(text || '{"message":"Error cargando configuración"}', {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await res.json();
  return NextResponse.json({ appWebPage: data?.appWebPage ?? null });
}

export async function PUT(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const appWebPage = body?.appWebPage;
  if (!appWebPage || typeof appWebPage !== 'object') {
    return NextResponse.json({ message: 'appWebPage inválido' }, { status: 400 });
  }

  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/admin/home`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ appWebPage }),
    cache: 'no-store',
  });

  const text = await res.text();
  if (!res.ok) {
    return new NextResponse(text || '{"message":"No se pudo guardar"}', {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return NextResponse.json({ ok: true });
}
