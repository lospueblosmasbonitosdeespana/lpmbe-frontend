import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email?.trim?.();
    if (!email) {
      return NextResponse.json({ message: 'Email requerido' }, { status: 400 });
    }

    const API_BASE = getApiUrl();
    const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, origen: body?.origen || 'web' }),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
