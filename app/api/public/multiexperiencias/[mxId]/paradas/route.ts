import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mxId: string }> },
) {
  const { mxId } = await params;
  const API_BASE = getApiUrl();

  try {
    const res = await fetch(`${API_BASE}/multiexperiencias/${mxId}/paradas`, {
      cache: 'no-store',
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`[PARADAS MX ${mxId}] Error:`, error);
    return NextResponse.json({ error: 'Error cargando paradas' }, { status: 500 });
  }
}
