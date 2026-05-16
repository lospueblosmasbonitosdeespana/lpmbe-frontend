import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/reservas
 * Crea una solicitud de reserva en un negocio. Endpoint público — funciona
 * tanto si el cliente está logueado como si no. Si hay sesión activa y el
 * usuario es socio, el backend lo verificará y enlazará automáticamente.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: 'Body inválido' }, { status: 400 });
  }
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const upstream = await fetch(`${getApiUrl()}/reservas`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
