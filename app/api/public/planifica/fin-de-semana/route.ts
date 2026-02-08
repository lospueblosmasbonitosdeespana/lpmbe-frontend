import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function GET() {
  const API_BASE = getApiUrl();

  const res = await fetch(`${API_BASE}/public/planifica/fin-de-semana`, {
    cache: 'no-store',
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
