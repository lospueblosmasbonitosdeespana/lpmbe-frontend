import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

/**
 * POST /api/club/suscripcion/reactivar
 * Reactiva la renovación automática de la membresía del Club de Amigos
 * (deshace una cancelación pendiente antes de que expire el período).
 */
export async function POST() {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/club/suscripcion/reactivar`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const errorData = await upstream.json().catch(() => ({}));
      const errorText = errorData?.message ?? errorData?.error ?? 'Error';
      return NextResponse.json({ error: errorText }, { status: upstream.status });
    }

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    if (error?.name === 'TypeError' && error?.message?.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'upstream_fetch_failed', upstream: upstreamUrl },
        { status: 502 }
      );
    }
    return NextResponse.json({ error: error?.message ?? 'Error interno' }, { status: 500 });
  }
}
