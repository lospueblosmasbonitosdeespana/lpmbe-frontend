import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

async function getToken() {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}

/**
 * BFF de proxy a `GET /club/admin/recursos/mapa-todos` del backend. Devuelve
 * la lista plana de TODOS los recursos no-negocio (RRTT y RRNN, asociación
 * y pueblos) categorizados, para pintar el mapa unificado de gestión.
 */
export async function GET() {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 401 });
  }

  const apiUrl = getApiUrl();
  try {
    const res = await fetch(`${apiUrl}/club/admin/recursos/mapa-todos`, {
      method: 'GET',
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[API proxy] GET recursos-turisticos/mapa-todos:', err);
    return NextResponse.json(
      { message: 'Error de conexión con el servidor' },
      { status: 502 },
    );
  }
}
