import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ puebloId: string }> },
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { puebloId } = await params;
  const res = await fetch(`${getApiUrl()}/club/negocios/pueblo/${puebloId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ puebloId: string }> },
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.nombre !== 'string' || !body.nombre.trim()) {
    return NextResponse.json({ message: 'Bad Request: nombre requerido' }, { status: 400 });
  }

  const { puebloId } = await params;
  const res = await fetch(`${getApiUrl()}/club/negocios/pueblo/${puebloId}`, {
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
