import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const API_BASE = getApiUrl();
    const res = await fetch(`${API_BASE}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false }, { status: res.status });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
