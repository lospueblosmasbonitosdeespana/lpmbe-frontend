import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function GET(req: Request) {
  const API_BASE = getApiUrl();
  const { searchParams } = new URL(req.url);
  
  const type = searchParams.get('type');
  const queryString = type ? `?type=${type}` : '';

  const upstream = await fetch(`${API_BASE}/public/cms/documentos${queryString}`, {
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
