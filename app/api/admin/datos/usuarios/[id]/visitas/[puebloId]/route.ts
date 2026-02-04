import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; puebloId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, puebloId } = await params;
    const body = await req.json();
    const { origen } = body;
    if (origen !== 'GPS' && origen !== 'MANUAL') {
      return NextResponse.json(
        { error: 'origen debe ser GPS o MANUAL' },
        { status: 400 }
      );
    }

    const API_BASE = getApiUrl();
    const res = await fetch(
      `${API_BASE}/admin/datos/usuarios/${id}/visitas/${puebloId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ origen }),
      }
    );

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; puebloId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, puebloId } = await params;

    const API_BASE = getApiUrl();
    const res = await fetch(
      `${API_BASE}/admin/datos/usuarios/${id}/visitas/${puebloId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

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
