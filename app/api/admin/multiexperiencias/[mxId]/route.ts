import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

// PUT /admin/multiexperiencias/:mxId
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ mxId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { mxId } = await params;
  const body = await req.json().catch(() => null);

  // ✅ ÚNICA VALIDACIÓN: titulo no vacío (si se envía)
  if (body && body.titulo !== undefined) {
    if (typeof body.titulo !== 'string' || !body.titulo.trim()) {
      return NextResponse.json(
        { message: 'Bad Request: titulo no puede estar vacío' },
        { status: 400 }
      );
    }
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/multiexperiencias/${mxId}`;

  if (DEV_LOGS) {
    console.error('[admin/multiexperiencias PUT] upstreamUrl:', upstreamUrl);
    console.error('[admin/multiexperiencias PUT] body:', body);
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
      console.error('[admin/multiexperiencias PUT] fetch error:', error);
    }

    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}

// DELETE /admin/multiexperiencias/:mxId
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ mxId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { mxId } = await params;
  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/multiexperiencias/${mxId}`;

  if (DEV_LOGS) {
    console.error('[admin/multiexperiencias DELETE] upstreamUrl:', upstreamUrl);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'DELETE',
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
      console.error('[admin/multiexperiencias DELETE] fetch error:', error);
    }

    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
