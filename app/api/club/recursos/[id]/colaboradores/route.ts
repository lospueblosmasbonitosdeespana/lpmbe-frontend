import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

async function getToken() {
  const store = await cookies();
  return store.get('token')?.value ?? null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  const apiUrl = getApiUrl();

  try {
    const res = await fetch(`${apiUrl}/club/recursos/${id}/colaboradores`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[API proxy] GET colaboradores:', err);
    return NextResponse.json(
      { message: 'Error de conexión con el servidor' },
      { status: 502 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Cuerpo JSON inválido' },
      { status: 400 },
    );
  }

  const apiUrl = getApiUrl();

  try {
    const res = await fetch(`${apiUrl}/club/recursos/${id}/colaboradores`, {
      method: 'POST',
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
    console.error('[API proxy] POST colaboradores:', err);
    return NextResponse.json(
      { message: 'Error de conexión con el servidor' },
      { status: 502 },
    );
  }
}
