import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const API_BASE = getApiUrl();

// PATCH /api/usuarios/me/direcciones/[id] - Actualizar dirección
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: 'ID requerido' }, { status: 400 });
  }

  try {
    const body = await req.json();

    const res = await fetch(`${API_BASE}/usuarios/me/direcciones/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/usuarios/me/direcciones/[id] - Eliminar dirección
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: 'ID requerido' }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_BASE}/usuarios/me/direcciones/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (res.status === 204 || res.ok) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
