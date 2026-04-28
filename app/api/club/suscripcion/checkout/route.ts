import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || !['ANUAL', 'MENSUAL'].includes(body.plan) || !body.successUrl || !body.cancelUrl) {
    return NextResponse.json(
      { message: 'Bad Request: plan (ANUAL|MENSUAL), successUrl y cancelUrl son obligatorios' },
      { status: 400 }
    );
  }

  const upstreamUrl = `${getApiUrl()}/club/suscripcion/checkout`;
  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Error interno' }, { status: 500 });
  }
}
