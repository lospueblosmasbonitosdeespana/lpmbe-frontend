import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

/**
 * POST /api/club/suscripcion/activar
 * Activa la membresía del Club de Amigos.
 * Body: { tipo: 'ANUAL' | 'MENSUAL', importeCents?: number }
 *
 * Cuando NEXT_PUBLIC_CLUB_ALTA_ABIERTO=true, este endpoint estará disponible
 * para el flujo de alta. Antes de eso, el frontend muestra "Próximamente"
 * y no permite el alta.
 */
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !['ANUAL', 'MENSUAL'].includes(body.tipo)) {
    return NextResponse.json(
      { message: 'Bad Request: tipo debe ser ANUAL o MENSUAL' },
      { status: 400 }
    );
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/club/suscripcion/activar`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tipo: body.tipo,
        importeCents: typeof body.importeCents === 'number' ? body.importeCents : undefined,
      }),
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const errorData = await upstream.json().catch(() => ({}));
      const errorText = errorData?.message ?? errorData?.error ?? await upstream.text().catch(() => 'Error');
      return NextResponse.json({ error: errorText }, { status: upstream.status });
    }

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    if (error?.name === 'TypeError' && error?.message?.includes('fetch failed')) {
      return NextResponse.json(
        {
          error: 'upstream_fetch_failed',
          upstream: upstreamUrl,
          detail: error?.message ?? 'No se pudo conectar al backend',
        },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
