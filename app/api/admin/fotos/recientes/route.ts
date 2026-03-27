import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const maxDuration = 30;

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit') || '50';

  const API = getApiUrl();
  const res = await fetch(`${API}/admin/fotos/recientes?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    return NextResponse.json({ message: 'Error fetching recent photos' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
