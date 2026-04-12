import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

type Ctx = { params: Promise<{ puebloId: string }> };

async function proxy(method: string, puebloId: string, body?: any) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const url = `${getApiUrl()}/admin/pueblos/${puebloId}/ficha`;

  try {
    const upstream = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => 'Error desconocido');
      return NextResponse.json({ error: errorText }, { status: upstream.status });
    }

    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    if (error?.name === 'TypeError' && error?.message?.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'upstream_fetch_failed', upstream: url, detail: error?.message },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: error?.message ?? 'Error interno' }, { status: 500 });
  }
}

export async function GET(_req: Request, { params }: Ctx) {
  const { puebloId } = await params;
  return proxy('GET', puebloId);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { puebloId } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  return proxy('PATCH', puebloId, body);
}
