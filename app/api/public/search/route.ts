import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q') ?? '';
  const lang = searchParams.get('lang') ?? 'es';

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ tags: [], multiexperiencias: [], recursos: [], colecciones: [] });
  }

  const API_BASE = getApiUrl();
  try {
    const params = new URLSearchParams({ q: q.trim(), lang });
    const res = await fetch(`${API_BASE}/public/search?${params}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return NextResponse.json({ tags: [], multiexperiencias: [], recursos: [], colecciones: [] }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ tags: [], multiexperiencias: [], recursos: [], colecciones: [] }, { status: 502 });
  }
}
