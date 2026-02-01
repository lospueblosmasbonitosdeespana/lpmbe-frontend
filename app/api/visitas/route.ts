import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApiUrl } from '@/lib/api';

const AUTH_COOKIE_NAME = 'lpbme_auth_token';

/**
 * POST /api/visitas
 * Registra una visita manual a un pueblo
 * Body: { puebloId: number }
 */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  let body: { puebloId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  if (!body.puebloId || typeof body.puebloId !== 'number') {
    return NextResponse.json({ error: 'puebloId requerido' }, { status: 400 });
  }

  const API_BASE = getApiUrl();

  try {
    const res = await fetch(`${API_BASE}/visitas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ puebloId: body.puebloId }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || 'Error al registrar visita' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[POST /api/visitas] Error:', error);
    return NextResponse.json(
      { error: 'Error de conexión con el servidor' },
      { status: 500 }
    );
  }
}
