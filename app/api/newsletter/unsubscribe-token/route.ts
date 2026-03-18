import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || '').trim();
    if (!token) {
      return NextResponse.json({ message: 'Token requerido' }, { status: 400 });
    }

    const API_BASE = getApiUrl();
    const res = await fetch(`${API_BASE}/newsletter/unsubscribe-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Error interno' }, { status: 500 });
  }
}
