import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { puebloId, origen } = body;
    if (typeof puebloId !== 'number' && typeof puebloId !== 'string') {
      return NextResponse.json(
        { error: 'puebloId es obligatorio' },
        { status: 400 }
      );
    }

    const API_BASE = getApiUrl();
    const res = await fetch(`${API_BASE}/admin/datos/usuarios/${id}/visitas`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        puebloId: Number(puebloId),
        origen: origen === 'GPS' ? 'GPS' : 'MANUAL',
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
