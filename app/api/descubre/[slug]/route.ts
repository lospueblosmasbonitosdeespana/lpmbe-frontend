import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';
import { fetchWithTimeout } from '@/lib/fetch-safe';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get('lang') || 'es';
  const API_BASE = getApiUrl();

  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/public/descubre/${encodeURIComponent(slug)}?lang=${lang}`,
      { next: { revalidate: 60 }, timeoutMs: 15000 },
    );
    if (!res.ok) return NextResponse.json({ error: 'not_found' }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'upstream_error' }, { status: 502 });
  }
}
