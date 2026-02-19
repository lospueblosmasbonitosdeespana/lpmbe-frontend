import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const recursoId = url.searchParams.get('recursoId');
  const days = url.searchParams.get('days') || '7';

  if (!recursoId) {
    return NextResponse.json({ message: 'recursoId requerido' }, { status: 400 });
  }

  const API_BASE = getApiUrl();
  const upstream = await fetch(
    `${API_BASE}/club/validador/metricas?recursoId=${recursoId}&days=${days}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  );

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
