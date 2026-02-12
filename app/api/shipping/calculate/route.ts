import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

/**
 * POST /api/shipping/calculate
 * Público (no requiere auth) - calcula envío para el carrito.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${getApiUrl()}/public/shipping/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error interno' },
      { status: 500 },
    );
  }
}
