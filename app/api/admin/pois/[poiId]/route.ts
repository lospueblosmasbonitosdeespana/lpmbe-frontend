import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

// PUT /admin/pois/:poiId
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ poiId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { poiId } = await params;
  const body = await req.json().catch(() => null);

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/pois/${poiId}`;

  if (DEV_LOGS) {
    console.error('[admin/pois PUT] upstreamUrl:', upstreamUrl);
    console.error('[admin/pois PUT] body:', body);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body || {}),
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
      console.error('[admin/pois PUT] fetch error:', {
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

// DELETE /admin/pois/:poiId
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ poiId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { poiId } = await params;
  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/pois/${poiId}`;

  if (DEV_LOGS) {
    console.error('[admin/pois DELETE] upstreamUrl:', upstreamUrl);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'DELETE',
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
      console.error('[admin/pois DELETE] fetch error:', {
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
