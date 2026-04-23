import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET(req: NextRequest) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const API_BASE = getApiUrl();
    const qs = req.nextUrl.searchParams.toString();
    const suffix = qs ? `?${qs}` : '';
    const res = await fetch(`${API_BASE}/admin/newsletter/press-contacts/filters${suffix}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Error interno' }, { status: 500 });
  }
}
