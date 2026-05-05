import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET(
  _req: Request,
  context: { params: Promise<{ puebloId: string }> },
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { puebloId } = await context.params;
  const pid = Number(puebloId);
  if (!pid || Number.isNaN(pid)) {
    return NextResponse.json({ message: 'Bad Request: puebloId inválido' }, { status: 400 });
  }

  const upstreamUrl = `${getApiUrl()}/club/validador/pueblo/${pid}/recursos-validables`;
  const upstream = await fetch(upstreamUrl, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
