import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

/**
 * GET /api/club/recompensas
 * Devuelve catálogo de recompensas activas para el socio + saldo + elegibilidad
 * por recompensa (puedeCanjear, puntosFaltan, stockDisponible, topeAlcanzado).
 */
export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${getApiUrl()}/club/recompensas`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
