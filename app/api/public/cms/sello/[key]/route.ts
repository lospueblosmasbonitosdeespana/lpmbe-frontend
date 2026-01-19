import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const API_BASE = getApiUrl();

  const upstream = await fetch(`${API_BASE}/public/cms/sello/${key}`, {
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
