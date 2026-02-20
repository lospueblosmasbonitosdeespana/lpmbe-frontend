import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Cuerpo JSON inválido' }, { status: 400 });
  }

  const apiUrl = getApiUrl();
  try {
    const res = await fetch(`${apiUrl}/public/rutas/generar`, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[API proxy] POST public/rutas/generar:', err);
    return NextResponse.json(
      { message: 'Error de conexión con el servidor' },
      { status: 502 }
    );
  }
}
