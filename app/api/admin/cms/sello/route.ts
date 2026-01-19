import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';
import { getToken } from '@/lib/auth';

export async function GET() {
  const API_BASE = getApiUrl();
  const token = await getToken();

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const upstream = await fetch(`${API_BASE}/admin/cms/sello`, {
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
