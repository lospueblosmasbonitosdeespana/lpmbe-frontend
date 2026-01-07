import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function PATCH(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.currentPassword !== 'string' || typeof body.newPassword !== 'string') {
    return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  }

  const API_BASE = getApiUrl();
  try {
    const upstream = await fetch(`${API_BASE}/usuarios/me/password`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      }),
      cache: 'no-store',
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}















