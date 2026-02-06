import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const API_BASE = getApiUrl();
    const res = await fetch(`${API_BASE}/newsletter/editions`, {
      cache: 'no-store',
    });
    const data = await res.json().catch(() => []);
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 }
    );
  }
}
