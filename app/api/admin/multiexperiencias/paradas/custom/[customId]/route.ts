import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

// DELETE /admin/multiexperiencias/paradas/custom/:customId
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ customId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { customId } = await params;
  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/multiexperiencias/paradas/custom/${customId}`;

  if (DEV_LOGS) {
    console.error('[admin/multiexperiencias/paradas/custom DELETE] upstreamUrl:', upstreamUrl);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (DEV_LOGS) {
      console.error('[admin/multiexperiencias/paradas/custom DELETE] upstream status:', upstream.status);
    }

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => 'Error desconocido');
      if (DEV_LOGS) {
        console.error('[admin/multiexperiencias/paradas/custom DELETE] error text:', errorText);
      }
      return NextResponse.json({ error: errorText }, { status: upstream.status });
    }

    const data = await upstream.json().catch(() => ({ message: 'Eliminado' }));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    if (DEV_LOGS) {
      console.error('[admin/multiexperiencias/paradas/custom DELETE] fetch error:', error);
    }

    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
