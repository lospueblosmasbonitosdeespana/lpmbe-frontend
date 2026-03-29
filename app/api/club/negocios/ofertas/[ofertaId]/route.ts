import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ofertaId: string }> },
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  const { ofertaId } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ message: 'Body inválido' }, { status: 400 });

  try {
    const res = await fetch(`${getApiUrl()}/club/negocios/ofertas/${ofertaId}`, {
      method: 'PATCH',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error de conexión' }, { status: 502 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ ofertaId: string }> },
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'No autorizado' }, { status: 401 });

  const { ofertaId } = await params;
  try {
    const res = await fetch(`${getApiUrl()}/club/negocios/ofertas/${ofertaId}`, {
      method: 'DELETE',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Error de conexión' }, { status: 502 });
  }
}
