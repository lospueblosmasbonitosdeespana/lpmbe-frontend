import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const upstreamUrl = `${getApiUrl()}/club/suscripcion/stripe-status`;
  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const data = await upstream.json().catch(() => ({ anualReady: false, mensualReady: false }));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ anualReady: false, mensualReady: false }, { status: 200 });
  }
}
