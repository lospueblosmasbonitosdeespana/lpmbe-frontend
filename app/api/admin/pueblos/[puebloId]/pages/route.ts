import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ puebloId: string }> }
) {
  const { puebloId } = await params;
  const token = await getToken();

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const API_BASE = getApiUrl();

  const res = await fetch(`${API_BASE}/admin/pueblos/${puebloId}/pages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const text = await res.text();

  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ puebloId: string }> }
) {
  const { puebloId } = await params;
  const token = await getToken();

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const API_BASE = getApiUrl();
  const body = await request.text();

  const upstream = await fetch(`${API_BASE}/admin/pueblos/${puebloId}/pages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
    cache: 'no-store',
  });

  const text = await upstream.text();

  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
