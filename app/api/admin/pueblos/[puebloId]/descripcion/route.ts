import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

// GET /admin/pueblos/:puebloId/descripcion
export async function GET(
  req: Request,
  { params }: { params: Promise<{ puebloId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { puebloId } = await params;
  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/pueblos/${puebloId}/descripcion`;

  if (DEV_LOGS) {
    console.error('[admin/pueblos/descripcion GET] upstreamUrl:', upstreamUrl);
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
      console.error('[admin/pueblos/descripcion GET] fetch error:', {
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

// PUT /admin/pueblos/:puebloId/descripcion
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ puebloId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { puebloId } = await params;
  
  // Leer body del request
  const body = await req.json().catch(() => null);
  
  if (!body || typeof body.descripcion !== 'string') {
    return NextResponse.json(
      { message: 'Bad Request: descripcion es requerida' },
      { status: 400 }
    );
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/pueblos/${puebloId}/descripcion`;

  if (DEV_LOGS) {
    console.error('[admin/pueblos/descripcion PUT] upstreamUrl:', upstreamUrl);
    console.error('[admin/pueblos/descripcion PUT] body:', body);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
      console.error('[admin/pueblos/descripcion PUT] fetch error:', {
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
