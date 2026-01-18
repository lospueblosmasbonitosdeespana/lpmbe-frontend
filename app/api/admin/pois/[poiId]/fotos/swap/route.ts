import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

// POST /admin/pois/:poiId/fotos/swap
export async function POST(
  req: Request,
  { params }: { params: Promise<{ poiId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { poiId } = await params;
  const body = await req.json().catch(() => null);

  if (!body || !body.aId || !body.bId) {
    return NextResponse.json(
      { message: 'Bad Request: aId y bId son requeridos' },
      { status: 400 }
    );
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/pois/${poiId}/fotos/swap`;

  if (DEV_LOGS) {
    console.error('[admin/pois/fotos/swap POST] upstreamUrl:', upstreamUrl);
    console.error('[admin/pois/fotos/swap POST] body:', body);
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
      console.error('[admin/pois/fotos/swap POST] upstream status:', upstream.status);
    }

    return new Response(text, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (error: any) {
    if (DEV_LOGS) {
      console.error('[admin/pois/fotos/swap POST] fetch error:', {
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
