import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

// GET /api/orders/shipping-config - Configuración de envío (público)
export async function GET() {
  try {
    const res = await fetch(`${getApiUrl()}/orders/shipping-config`, {
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
