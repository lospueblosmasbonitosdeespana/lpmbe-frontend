import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/admin/club/preload-validation/pueblos-recursos-extendido
 *
 * Listado de pueblos enriquecido con contadores de pre-carga IA pendiente
 * y fechas de envío/validación. Lo consume la página
 * /gestion/asociacion/club/recursos-pueblos.
 */
export async function GET() {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const res = await fetch(
    `${getApiUrl()}/admin/club/preload-validation/pueblos-recursos-extendido`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  );
  const text = await res.text();
  return new NextResponse(text || '[]', {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
