import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const folder = typeof body?.folder === 'string' ? body.folder : undefined;

  try {
    const API_BASE = getApiUrl();
    const upstream = await fetch(`${API_BASE}/media/upload-ticket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folder }),
      cache: 'no-store',
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const msg = data?.message ?? data?.error ?? 'No se pudo crear ticket de subida';
      return NextResponse.json(
        { error: typeof msg === 'string' ? msg : 'No se pudo crear ticket de subida' },
        { status: upstream.status },
      );
    }

    return NextResponse.json({
      ticket: data?.ticket,
      expiresInSec: data?.expiresInSec ?? 900,
      uploadUrl: `${API_BASE}/media/upload-with-ticket`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 },
    );
  }
}
