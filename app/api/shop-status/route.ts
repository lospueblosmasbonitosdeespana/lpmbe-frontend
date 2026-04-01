import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';
import { fetchWithTimeout } from '@/lib/fetch-safe';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const API_BASE = getApiUrl();
    const res = await fetchWithTimeout(`${API_BASE}/public/site-settings`, {
      cache: 'no-store',
      timeoutMs: 3000,
      retries: 0,
    });
    if (!res.ok) {
      return NextResponse.json({ tiendaEstado: 'ABIERTA', tiendaMensaje: null, tiendaReapertura: null });
    }
    const data = await res.json();
    return NextResponse.json({
      tiendaEstado: data.tiendaEstado ?? 'ABIERTA',
      tiendaMensaje: data.tiendaMensaje ?? null,
      tiendaReapertura: data.tiendaReapertura ?? null,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ tiendaEstado: 'ABIERTA', tiendaMensaje: null, tiendaReapertura: null });
  }
}
