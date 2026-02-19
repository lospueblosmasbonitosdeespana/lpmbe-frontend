import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import { fetchWithTimeout } from '@/lib/fetch-safe';

const DEV_LOGS = process.env.NODE_ENV === 'development';

// GET /admin/pueblos/:puebloId/autorizados
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
  const upstreamUrl = `${API_BASE}/admin/pueblos/${puebloId}/autorizados`;

  if (DEV_LOGS) {
    console.error('[admin/pueblos/autorizados GET] upstreamUrl:', upstreamUrl);
  }

  try {
    const upstream = await fetchWithTimeout(upstreamUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const errorData = await upstream.json().catch(() => ({ message: 'Error desconocido' }));
      return NextResponse.json(errorData, { status: upstream.status });
    }

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    if (DEV_LOGS) {
      console.error('[admin/pueblos/autorizados GET] fetch error:', error?.message);
    }

    return NextResponse.json(
      { message: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}

// POST /admin/pueblos/:puebloId/autorizados
export async function POST(
  req: Request,
  { params }: { params: Promise<{ puebloId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { puebloId } = await params;
  const body = await req.json().catch(() => null);

  if (!body || !body.email) {
    return NextResponse.json(
      { message: 'Email es requerido' },
      { status: 400 }
    );
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/pueblos/${puebloId}/autorizados`;

  if (DEV_LOGS) {
    console.error('[admin/pueblos/autorizados POST] upstreamUrl:', upstreamUrl);
    console.error('[admin/pueblos/autorizados POST] body:', { ...body, password: body.password ? '***' : undefined, rol: body.rol, recursoId: body.recursoId });
  }

  try {
    const upstream = await fetchWithTimeout(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await upstream.json().catch(() => ({ message: 'Error desconocido' }));

    if (!upstream.ok) {
      return NextResponse.json(data, { status: upstream.status });
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    if (DEV_LOGS) {
      console.error('[admin/pueblos/autorizados POST] fetch error:', error?.message);
    }

    return NextResponse.json(
      { message: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
