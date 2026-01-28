import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

// GET /api/media
export async function GET(req: Request) {
  const token = await getToken();
  const { searchParams } = new URL(req.url);
  const ownerType = searchParams.get('ownerType');
  const ownerId = searchParams.get('ownerId');
  
  const API_BASE = getApiUrl();
  
  // Detectar si hay token para usar endpoint admin o public
  let upstreamUrl: string;
  if (token) {
    // Con token → admin endpoint
    upstreamUrl = `${API_BASE}/admin/media?ownerType=${ownerType ?? ''}&ownerId=${ownerId ?? ''}`;
  } else {
    // Sin token → public endpoint
    upstreamUrl = `${API_BASE}/public/media?ownerType=${ownerType ?? ''}&ownerId=${ownerId ?? ''}`;
  }

  if (DEV_LOGS) {
    console.error('[api/media GET] upstreamUrl:', upstreamUrl);
    console.error('[api/media GET] hasToken:', !!token);
  }

  try {
    const headers: Record<string, string> = {};
    
    // Si hay token, añadir Authorization header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => 'Error desconocido');
      return NextResponse.json({ error: errorText }, { status: upstream.status });
    }

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    if (DEV_LOGS) {
      console.error('[api/media GET] fetch error:', {
        name: error?.name,
        message: error?.message,
      });
    }

    if (error?.name === 'TypeError' && error?.message?.includes('fetch failed')) {
      return NextResponse.json(
        {
          error: 'upstream_fetch_failed',
          upstream: upstreamUrl,
          detail: error?.message ?? 'No se pudo conectar al backend',
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        error: error?.message ?? 'Error interno',
        upstream: upstreamUrl,
      },
      { status: 500 }
    );
  }
}
