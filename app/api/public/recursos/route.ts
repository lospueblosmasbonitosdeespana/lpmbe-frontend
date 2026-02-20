import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope');

  const apiUrl = getApiUrl();
  const url = new URL(`${apiUrl}/public/recursos`);
  if (scope) {
    url.searchParams.set('scope', scope);
  }

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[API proxy] GET public/recursos:', err);
    return NextResponse.json(
      { message: 'Error de conexión con el servidor' },
      { status: 502 }
    );
  }
}
