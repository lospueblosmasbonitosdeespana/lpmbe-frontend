import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

export async function GET(
  _req: Request,
  context: { params: Promise<{ recursoId: string }> },
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { recursoId } = await context.params;
  const recursoIdNum = Number(recursoId);
  if (!Number.isFinite(recursoIdNum) || recursoIdNum <= 0) {
    return NextResponse.json(
      { message: 'Bad Request: recursoId inválido' },
      { status: 400 },
    );
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/club/validador/recursos/${recursoIdNum}/combos-pendientes-hoy`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => 'Error desconocido');
      return NextResponse.json({ error: errorText }, { status: upstream.status });
    }

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    if (DEV_LOGS) {
      console.error('[club/validador/combos-pendientes-hoy] fetch error:', {
        name: error?.name,
        message: error?.message,
        cause: error?.cause,
      });
    }
    return NextResponse.json(
      { error: error?.message ?? 'Error interno', upstream: upstreamUrl },
      { status: 500 },
    );
  }
}
