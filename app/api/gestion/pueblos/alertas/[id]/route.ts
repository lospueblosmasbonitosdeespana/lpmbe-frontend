import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getToken();
  
  if (!token) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  const API_BASE = getApiUrl();

  const upstream = await fetch(`${API_BASE}/notificaciones/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    return NextResponse.json(
      { message: 'Error upstream', status: upstream.status, body: text.slice(0, 500) },
      { status: upstream.status }
    );
  }

  return new NextResponse(null, { status: upstream.status === 204 ? 204 : 200 });
}

