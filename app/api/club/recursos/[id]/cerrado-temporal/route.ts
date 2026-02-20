import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

async function getToken() {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ message: 'ID requerido' }, { status: 400 });
  }

  let body: { cerradoTemporal?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Cuerpo JSON inválido' },
      { status: 400 }
    );
  }

  const apiUrl = getApiUrl();
  try {
    const res = await fetch(`${apiUrl}/club/recursos/${id}/cerrado-temporal`, {
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
  } catch (err) {
    console.error('[API proxy] PATCH cerrado-temporal:', err);
    return NextResponse.json(
      { message: 'Error de conexión con el servidor' },
      { status: 502 }
    );
  }
}
