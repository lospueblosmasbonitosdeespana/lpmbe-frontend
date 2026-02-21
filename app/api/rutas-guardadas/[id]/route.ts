import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

async function proxy(
  id: string,
  init: RequestInit & { method: string }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json(
      { message: 'Debes iniciar sesión' },
      { status: 401 }
    );
  }

  const API_BASE = getApiUrl();
  const url = `${API_BASE}/rutas-guardadas/${id}`;

  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.headers as Record<string, string>),
      },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Error' },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxy(id, { method: 'GET' });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: 'Datos inválidos' }, { status: 400 });
  }
  return proxy(id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await proxy(id, { method: 'DELETE' });
  if (res.status === 200) {
    return NextResponse.json({ success: true });
  }
  return res;
}
