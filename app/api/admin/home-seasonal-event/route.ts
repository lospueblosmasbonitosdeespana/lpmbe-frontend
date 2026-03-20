import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const VALID_EVENTS = ['SEMANA_SANTA', 'NOCHE_ROMANTICA', 'NAVIDAD'] as const;

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
  const event = VALID_EVENTS.includes(data?.appSeasonalEvent) ? data.appSeasonalEvent : 'SEMANA_SANTA';
  return NextResponse.json({ appSeasonalEvent: event });
}

export async function PUT(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const event = body?.appSeasonalEvent;
  if (!VALID_EVENTS.includes(event)) {
    return NextResponse.json(
      { message: 'appSeasonalEvent inválido. Usa SEMANA_SANTA, NOCHE_ROMANTICA o NAVIDAD.' },
      { status: 400 },
    );
  }

  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/admin/home`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ appSeasonalEvent: event }),
    cache: 'no-store',
  });

  const text = await res.text();
  if (!res.ok) {
    return new NextResponse(text || '{"message":"No se pudo guardar"}', {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return NextResponse.json({ ok: true, appSeasonalEvent: event });
}
