import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const TIPOS_VALIDOS = [
  'INSTAGRAM_STORY',
  'INSTAGRAM_POST',
  'INSTAGRAM_REEL',
  'FACEBOOK_POST',
];

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.recursoId !== 'number' ||
    !TIPOS_VALIDOS.includes(body.tipo)
  ) {
    return NextResponse.json(
      { message: 'Bad Request: recursoId numérico y tipo válido requeridos' },
      { status: 400 },
    );
  }

  const res = await fetch(`${getApiUrl()}/club/rrss/suelta`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
