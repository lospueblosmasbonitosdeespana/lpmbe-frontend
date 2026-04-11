import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';
import { fetchWithTimeout } from '@/lib/fetch-safe';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get('lang') || 'es';
  const API_BASE = getApiUrl();

  try {
    const res = await fetchWithTimeout(`${API_BASE}/public/descubre?lang=${lang}`, {
      next: { revalidate: 15 },
      timeoutMs: 8000,
    });
    if (!res.ok) return NextResponse.json([], { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
