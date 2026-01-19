import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function GET(req: Request) {
  const API_BASE = getApiUrl();
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit') ?? '20';

  const upstream = await fetch(`${API_BASE}/public/noticias?scope=ASOCIACION&limit=${limit}`, {
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
