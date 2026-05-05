import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.qrToken !== 'string' || typeof body.recursoId !== 'number') {
    return NextResponse.json({ message: 'Bad Request: qrToken (string) y recursoId (number) requeridos' }, { status: 400 });
  }

  // adultosUsados / menoresUsados son opcionales y se delegan al backend.
  // El backend ya valida contra el `maxAdultos` / `maxMenores` del recurso,
  // que para algunos hoteles o experiencias puede ser > 2.
  if (
    body.adultosUsados !== undefined &&
    (typeof body.adultosUsados !== 'number' || body.adultosUsados < 1 || body.adultosUsados > 20)
  ) {
    return NextResponse.json(
      { message: 'Bad Request: adultosUsados debe ser un número >= 1' },
      { status: 400 },
    );
  }
  if (
    body.menoresUsados !== undefined &&
    (typeof body.menoresUsados !== 'number' || body.menoresUsados < 0 || body.menoresUsados > 20)
  ) {
    return NextResponse.json(
      { message: 'Bad Request: menoresUsados debe ser un número >= 0' },
      { status: 400 },
    );
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/club/validador/scan`;

  if (DEV_LOGS) {
    console.error('[club/validador/scan] upstreamUrl:', upstreamUrl);
    console.error('[club/validador/scan] token exists:', !!token);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
      console.error('[club/validador/scan] fetch error:', {
        name: error?.name,
        message: error?.message,
        cause: error?.cause,
      });
    }

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
      {
        error: error?.message ?? 'Error interno',
        upstream: upstreamUrl,
      },
      { status: 500 }
    );
  }
}





