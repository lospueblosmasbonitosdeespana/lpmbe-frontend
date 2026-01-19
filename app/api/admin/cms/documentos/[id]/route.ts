import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';
import { getToken } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const API_BASE = getApiUrl();
  const token = await getToken();

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const upstream = await fetch(`${API_BASE}/admin/cms/documentos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (upstream.status === 204) {
    return NextResponse.json({ ok: true });
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const API_BASE = getApiUrl();
  const token = await getToken();

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const upstream = await fetch(`${API_BASE}/admin/cms/documentos/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (upstream.status === 204) {
    return NextResponse.json({ ok: true });
  }

  try {
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    if (upstream.status >= 200 && upstream.status < 300) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Error al borrar' }, { status: upstream.status });
  }
}
