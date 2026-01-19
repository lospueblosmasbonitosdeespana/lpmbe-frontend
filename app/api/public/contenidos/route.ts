import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function GET(req: Request) {
  const API_BASE = getApiUrl();
  const { searchParams } = new URL(req.url);
  
  // Construir query params
  const params = new URLSearchParams();
  if (searchParams.get('scope')) params.set('scope', searchParams.get('scope')!);
  if (searchParams.get('tipo')) params.set('tipo', searchParams.get('tipo')!);
  if (searchParams.get('puebloId')) params.set('puebloId', searchParams.get('puebloId')!);
  if (searchParams.get('limit')) params.set('limit', searchParams.get('limit')!);
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  
  const upstream = await fetch(`${API_BASE}/public/contenidos${queryString}`, {
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
