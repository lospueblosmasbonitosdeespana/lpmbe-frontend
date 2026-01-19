import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';
import { getToken } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const API_BASE = getApiUrl();
  const token = await getToken();

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const upstream = await fetch(`${API_BASE}/admin/cms/sello/${key}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const API_BASE = getApiUrl();
  const token = await getToken();

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const upstream = await fetch(`${API_BASE}/admin/cms/sello/${key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (upstream.status === 204) {
    return NextResponse.json({ ok: true });
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
