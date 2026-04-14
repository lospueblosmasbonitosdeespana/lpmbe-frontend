import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const API_BASE = getApiUrl();
  const searchParams = req.nextUrl.searchParams.toString();
  const url = `${API_BASE}/public/explorar${searchParams ? `?${searchParams}` : ''}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data, {
      status: res.status,
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    console.error('[EXPLORAR BFF] Error:', error);
    return NextResponse.json({ error: 'Error loading data' }, { status: 500 });
  }
}
