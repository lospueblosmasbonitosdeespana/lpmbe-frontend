import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const days = request.nextUrl.searchParams.get('days') ?? '30';

  try {
    const res = await fetch(`${getApiUrl()}/club/negocios/${id}/stats?days=${days}`, {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error de conexión' }, { status: 502 });
  }
}
