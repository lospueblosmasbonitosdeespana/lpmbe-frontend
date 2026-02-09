import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const API_BASE = getApiUrl();
  const upstream = await fetch(`${API_BASE}/pueblos/${slug}`, {
    cache: 'no-store',
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
  });
}
