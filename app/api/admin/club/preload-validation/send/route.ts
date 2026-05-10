import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/club/preload-validation/send
 *
 * Body: {
 *   puebloSlug: string,
 *   tipoLista?: 'turisticos' | 'naturales',
 *   asunto?: string,
 *   cuerpoCustomHtml?: string,
 *   destinatarios: string[],
 * }
 */
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.text();
  const res = await fetch(`${getApiUrl()}/admin/club/preload-validation/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text || '{}', {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
