import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET(request: NextRequest) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  const estado = request.nextUrl.searchParams.get('estado') ?? '';
  const qs = estado ? `?estado=${estado}` : '';

  try {
    const res = await fetch(`${getApiUrl()}/club/negocios/selection/candidaturas${qs}`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error de conexión' }, { status: 502 });
  }
}
