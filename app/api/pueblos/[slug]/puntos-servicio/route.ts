import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';
import { fetchWithTimeout } from '@/lib/fetch-safe';

// GET /pueblos/:slug/puntos-servicio (público, sin autenticación)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/pueblos/${slug}/puntos-servicio`;

  try {
    const upstream = await fetchWithTimeout(upstreamUrl, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => 'Error desconocido');
      return NextResponse.json({ error: errorText }, { status: upstream.status });
    }
    const data = await upstream.json().catch(() => []);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return NextResponse.json({ error: 'Tiempo de espera agotado', upstream: upstreamUrl }, { status: 504 });
    }
    return NextResponse.json({ error: error?.message ?? 'Error interno', upstream: upstreamUrl }, { status: 500 });
  }
}
