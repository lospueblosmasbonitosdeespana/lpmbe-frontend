import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

// POST /admin/fotos/reorder
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  
  if (!body) {
    return NextResponse.json(
      { message: 'Bad Request: body requerido' },
      { status: 400 }
    );
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/fotos/reorder`;

  if (DEV_LOGS) {
    console.log('[admin/fotos/reorder POST] upstreamUrl:', upstreamUrl);
    console.log('[admin/fotos/reorder POST] body:', body);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await upstream.text();
    
    if (DEV_LOGS) {
      console.log('[admin/fotos/reorder POST] status:', upstream.status);
      console.log('[admin/fotos/reorder POST] response:', text);
    }

    if (!upstream.ok) {
      return NextResponse.json({ error: text }, { status: upstream.status });
    }

    const data = JSON.parse(text || '{}');
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    if (DEV_LOGS) {
      console.error('[admin/fotos/reorder POST] fetch error:', {
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
