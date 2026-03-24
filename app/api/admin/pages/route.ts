import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const API_BASE = getApiUrl();
  const body = await req.json();

  const puebloId = body.puebloId;

  const cleanPayload = {
    scope: body.scope ?? 'PUEBLO',
    puebloId: puebloId ?? null,
    category: body.category,
    titulo: body.titulo,
    resumen: body.resumen || null,
    contenido: body.contenido,
    coverUrl: body.coverUrl || null,
    published: !!body.published,
  };

  const endpoint = puebloId
    ? `${API_BASE}/admin/pueblos/${puebloId}/pages`
    : `${API_BASE}/admin/pages`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(cleanPayload),
    cache: 'no-store',
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
