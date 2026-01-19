import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';
import { getToken } from '@/lib/auth';

export async function GET(req: Request) {
  const API_BASE = getApiUrl();
  const token = await getToken();
  const { searchParams } = new URL(req.url);

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = searchParams.get('type');
  const queryString = type ? `?type=${type}` : '';

  const upstream = await fetch(`${API_BASE}/admin/cms/documentos${queryString}`, {
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

export async function POST(req: Request) {
  const API_BASE = getApiUrl();
  const token = await getToken();

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const upstream = await fetch(`${API_BASE}/admin/cms/documentos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
