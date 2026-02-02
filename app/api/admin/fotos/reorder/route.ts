import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

// POST /admin/fotos/reorder
export async function POST(req: Request) {
  console.log('[admin/fotos/reorder POST] Iniciando...');
  
  const token = await getToken();
  console.log('[admin/fotos/reorder POST] Token presente:', !!token);
  
  if (!token) {
    console.error('[admin/fotos/reorder POST] No hay token - 401');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  console.log('[admin/fotos/reorder POST] Body recibido:', body);
  
  if (!body) {
    return NextResponse.json(
      { message: 'Bad Request: body requerido' },
      { status: 400 }
    );
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/fotos/reorder`;
  console.log('[admin/fotos/reorder POST] upstreamUrl:', upstreamUrl);

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
    console.log('[admin/fotos/reorder POST] upstream status:', upstream.status);
    console.log('[admin/fotos/reorder POST] upstream response:', text);

    if (!upstream.ok) {
      console.error('[admin/fotos/reorder POST] upstream error:', upstream.status, text);
      return NextResponse.json({ error: text }, { status: upstream.status });
    }

    const data = JSON.parse(text || '{}');
    console.log('[admin/fotos/reorder POST] ✅ Success');
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    console.error('[admin/fotos/reorder POST] fetch error:', {
      name: error?.name,
      message: error?.message,
    });

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
