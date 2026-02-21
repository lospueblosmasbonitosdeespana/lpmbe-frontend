import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ puebloId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { puebloId } = await params;
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/pueblos/${puebloId}/incorporacion`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'PATCH',
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
    if (error?.name === 'TypeError' && error?.message?.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'upstream_fetch_failed', detail: error?.message ?? 'No se pudo conectar al backend' },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
