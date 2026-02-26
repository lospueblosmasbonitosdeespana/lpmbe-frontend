import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

// PUT /admin/puntos-servicio/:id
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/puntos-servicio/${id}`;

  if (DEV_LOGS) console.error('[admin/puntos-servicio PUT]', upstreamUrl, body);

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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
    return NextResponse.json({ error: error?.message ?? 'Error interno', upstream: upstreamUrl }, { status: 500 });
  }
}

// DELETE /admin/puntos-servicio/:id
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/puntos-servicio/${id}`;

  if (DEV_LOGS) console.error('[admin/puntos-servicio DELETE]', upstreamUrl);

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => 'Error desconocido');
      return NextResponse.json({ error: errorText }, { status: upstream.status });
    }
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Error interno', upstream: upstreamUrl }, { status: 500 });
  }
}
