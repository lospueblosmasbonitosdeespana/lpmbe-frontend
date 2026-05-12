import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

/**
 * BFF para detalle de un RRTT-asociación. Llama al backend
 * `GET /club/recursos-rrtt-asociacion/:id`.
 *
 * Devuelve el recurso enriquecido (incluye horariosSemana,
 * cierresEspeciales, imprescindible y ratingVerificado) para
 * la página de edición.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const res = await fetch(
      `${getApiUrl()}/club/recursos-rrtt-asociacion/${id}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: 'No se pudo conectar al backend' },
      { status: 502 },
    );
  }
}
