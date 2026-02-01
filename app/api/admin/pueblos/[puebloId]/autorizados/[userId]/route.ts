import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

// DELETE /admin/pueblos/:puebloId/autorizados/:userId
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ puebloId: string; userId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { puebloId, userId } = await params;
  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/pueblos/${puebloId}/autorizados/${userId}`;

  if (DEV_LOGS) {
    console.error('[admin/pueblos/autorizados DELETE] upstreamUrl:', upstreamUrl);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const data = await upstream.json().catch(() => ({ message: 'Error desconocido' }));

    if (!upstream.ok) {
      return NextResponse.json(data, { status: upstream.status });
    }

    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    if (DEV_LOGS) {
      console.error('[admin/pueblos/autorizados DELETE] fetch error:', error?.message);
    }

    return NextResponse.json(
      { message: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
