import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function GET() {
  const API_BASE = getApiUrl();
  try {
    const res = await fetch(`${API_BASE}/public/tag-definiciones`, {
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({}, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}
