import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = searchParams.get('days') || '30';
  const recentLimit = searchParams.get('recentLimit') || '100';
  const API_BASE = getApiUrl();
  const url = `${API_BASE}/admin/datos/actividad?days=${encodeURIComponent(days)}&recentLimit=${encodeURIComponent(recentLimit)}`;

  try {
    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => 'Error');
      return NextResponse.json({ error: text }, { status: upstream.status });
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 502 },
    );
  }
}
