import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const target = new URL(`${getApiUrl()}/club/admin/canjes`);
  for (const k of ['page', 'limit', 'estado']) {
    const v = url.searchParams.get(k);
    if (v) target.searchParams.set(k, v);
  }

  const res = await fetch(target.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
