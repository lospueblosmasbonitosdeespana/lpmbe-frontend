import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

// DELETE /admin/pueblos/fotos/:fotoId
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ fotoId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { fotoId } = await params;
  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/pueblos/fotos/${fotoId}`;

  if (DEV_LOGS) {
    console.error('[admin/pueblos/fotos DELETE] upstreamUrl:', upstreamUrl);
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
      console.error('[admin/pueblos/fotos DELETE] fetch error:', {
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
