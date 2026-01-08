import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/club/qr/identidad/generar`;

  if (DEV_LOGS) {
    console.error('[club/qr/identidad/generar] upstreamUrl:', upstreamUrl);
    console.error('[club/qr/identidad/generar] token exists:', !!token);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
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
      console.error('[club/qr/identidad/generar] fetch error:', {
        name: error?.name,
        message: error?.message,
        cause: error?.cause,
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
