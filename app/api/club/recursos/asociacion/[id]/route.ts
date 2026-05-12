import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

/**
 * BFF para PATCH y DELETE de recursos de la asociación
 * (`scope='ASOCIACION'`, sin puebloId). Usado por la página
 * `/gestion/asociacion/club/rrtt-asociacion/[id]/editar` y por las
 * acciones inline del listado.
 *
 * El backend expone:
 *   - PATCH  /club/recursos/asociacion/:id  (UpdateRecursoAsociacionDto)
 *   - DELETE /club/recursos/asociacion/:id
 */

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  try {
    const res = await fetch(`${getApiUrl()}/club/recursos/asociacion/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: 'No se pudo conectar al backend' },
      { status: 502 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const res = await fetch(`${getApiUrl()}/club/recursos/asociacion/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: 'No se pudo conectar al backend' },
      { status: 502 },
    );
  }
}
