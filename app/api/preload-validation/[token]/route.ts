import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/preload-validation/[token]
 *
 * Endpoint PÚBLICO (sin autenticación): consulta los recursos asociados
 * al token. Solo lo usa la página /aprobar-recursos/[token].
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const res = await fetch(`${getApiUrl()}/preload-validation/${token}`, {
    method: 'GET',
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text || '{}', {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
