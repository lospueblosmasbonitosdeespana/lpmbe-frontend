import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const take = searchParams.get('take');
  const skip = searchParams.get('skip');
  const qs = new URLSearchParams();
  if (take) qs.set('take', take);
  if (skip) qs.set('skip', skip);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';

  try {
    const res = await fetch(
      `${getApiUrl()}/club/admin/lead-prelanzamiento${suffix}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: 'No se pudo conectar al backend' },
      { status: 502 },
    );
  }
}

