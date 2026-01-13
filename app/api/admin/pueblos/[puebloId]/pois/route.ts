import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

// GET /admin/pueblos/:puebloId/pois
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
  const upstreamUrl = `${API_BASE}/admin/pueblos/${puebloId}/pois`;

  if (DEV_LOGS) {
    console.error('[admin/pueblos/pois GET] upstreamUrl:', upstreamUrl);
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
      console.error('[admin/pueblos/pois GET] fetch error:', {
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

// POST /admin/pueblos/:puebloId/pois
export async function POST(
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
  
  // ✅ Solo validar nombre (lat/lng son opcionales, backend hace fallback)
  if (!body || !body.nombre) {
    return NextResponse.json(
      { message: 'Bad Request: nombre es requerido' },
      { status: 400 }
    );
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/pueblos/${puebloId}/pois`;

  console.log("[proxy pois POST]", {
    puebloId,
    hasCookie: !!req.headers.get("cookie"),
    hasAuthHeader: !!req.headers.get("authorization"),
    bodyKeys: body ? Object.keys(body) : [],
    body,
  });

  if (DEV_LOGS) {
    console.error('[admin/pueblos/pois POST] upstreamUrl:', upstreamUrl);
    console.error('[admin/pueblos/pois POST] body:', body);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body || {}),
      cache: 'no-store',
    });

    console.log("[proxy pois POST upstream]", { status: upstream.status });

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => 'Error desconocido');
      console.error("[proxy pois POST error]", { status: upstream.status, errorText });
      return NextResponse.json({ error: errorText }, { status: upstream.status });
    }

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    if (DEV_LOGS) {
      console.error('[admin/pueblos/pois POST] fetch error:', {
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
