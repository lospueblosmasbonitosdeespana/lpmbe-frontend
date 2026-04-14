import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const API_BASE = getApiUrl();
  const soloColecciones = request.nextUrl.searchParams.get('soloColecciones') ?? '';
  const qs = soloColecciones === 'true' ? '?soloColecciones=true' : '';
  try {
    const res = await fetch(`${API_BASE}/public/explorar/counts${qs}`, {
      next: { revalidate: 300 },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[EXPLORAR COUNTS BFF] Error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
