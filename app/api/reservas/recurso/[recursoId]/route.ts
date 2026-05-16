import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ recursoId: string }> },
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { recursoId } = await params;
  const url = new URL(req.url);
  const estado = url.searchParams.get('estado');
  const qs = estado ? `?estado=${encodeURIComponent(estado)}` : '';
  const res = await fetch(`${getApiUrl()}/reservas/recurso/${recursoId}${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
