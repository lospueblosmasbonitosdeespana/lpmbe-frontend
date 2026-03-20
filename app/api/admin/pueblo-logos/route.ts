import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const grouped = searchParams.get('grouped');
  const qs = grouped ? `?grouped=${grouped}` : '';

  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/admin/pueblo-logos${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: 'Bad Request' }, { status: 400 });

  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/admin/pueblo-logos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
