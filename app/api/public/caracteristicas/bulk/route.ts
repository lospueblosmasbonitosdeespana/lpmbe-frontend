import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get('ids') ?? '';
  if (!ids) return NextResponse.json({});

  const API_BASE = getApiUrl();
  try {
    const res = await fetch(
      `${API_BASE}/public/caracteristicas/bulk?ids=${encodeURIComponent(ids)}`,
      { next: { revalidate: 120 } },
    );
    if (!res.ok) return NextResponse.json({}, { status: res.status });
    return NextResponse.json(await res.json());
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}
