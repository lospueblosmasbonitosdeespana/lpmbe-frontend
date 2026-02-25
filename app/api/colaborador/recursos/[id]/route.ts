import { NextResponse, NextRequest } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  // El query param ?scope=PUEBLO indica recurso de pueblo; por defecto asociación
  const scope = req.nextUrl.searchParams.get('scope');
  const body = await req.text();

  // Para recursos de pueblo usamos /club/recursos/:id; para asociación /club/recursos/asociacion/:id
  const endpoint = scope === 'PUEBLO'
    ? `${getApiUrl()}/club/recursos/${id}`
    : `${getApiUrl()}/club/recursos/asociacion/${id}`;

  const upstream = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body,
    cache: 'no-store',
  });

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
