import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function PATCH(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.recursoId) {
    return NextResponse.json({ message: 'recursoId requerido' }, { status: 400 });
  }

  const API_BASE = getApiUrl();
  const upstream = await fetch(
    `${API_BASE}/club/recursos/${body.recursoId}/cerrado-temporal`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cerradoTemporal: body.cerradoTemporal }),
      cache: 'no-store',
    },
  );

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
