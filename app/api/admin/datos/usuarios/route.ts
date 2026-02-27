import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET(req: NextRequest) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();
  ['q', 'rol', 'limit', 'offset', 'order', 'orderBy', 'activo'].forEach((key) => {
    const val = searchParams.get(key);
    if (val != null && val !== '') params.set(key, val);
  });
  const qs = params.toString();
  const API_BASE = getApiUrl();
  const url = `${API_BASE}/admin/datos/usuarios${qs ? `?${qs}` : ''}`;

  try {
    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => 'Error');
      return NextResponse.json({ error: text }, { status: upstream.status });
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const API_BASE = getApiUrl();
  const url = `${API_BASE}/admin/datos/usuarios`;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON inválido' }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => 'Error');
      return NextResponse.json({ error: text }, { status: upstream.status });
    }

    const data = await upstream.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
