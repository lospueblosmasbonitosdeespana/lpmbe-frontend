import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const puebloId = searchParams.get('puebloId');
  const days = searchParams.get('days') || '7';
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!puebloId) {
    return NextResponse.json({ message: 'Bad Request: puebloId requerido' }, { status: 400 });
  }

  const API_BASE = getApiUrl();
  const params = new URLSearchParams({ puebloId });
  if (from && to) {
    params.set('from', from);
    params.set('to', to);
  } else {
    params.set('days', days);
  }
  const upstreamUrl = `${API_BASE}/club/validador/metricas-pueblo?${params.toString()}`;

  if (DEV_LOGS) {
    console.error('[club/validador/metricas-pueblo] upstreamUrl:', upstreamUrl);
    console.error('[club/validador/metricas-pueblo] token exists:', !!token);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
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
      console.error('[club/validador/metricas-pueblo] fetch error:', {
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



