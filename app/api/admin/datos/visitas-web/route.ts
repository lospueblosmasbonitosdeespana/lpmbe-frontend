import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET(request: NextRequest) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') ?? '30';
    const API_BASE = getApiUrl();
    const res = await fetch(`${API_BASE}/admin/datos/visitas-web?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
