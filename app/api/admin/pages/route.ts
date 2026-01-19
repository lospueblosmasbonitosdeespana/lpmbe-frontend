import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const API_BASE = getApiUrl();
  const body = await req.json();

  // LIMPIAR payload: SOLO los campos que espera /admin/pages
  // Incluir scope (default PUEBLO si no viene) y permitir puebloId null
  const cleanPayload = {
    scope: body.scope ?? 'PUEBLO',
    puebloId: body.puebloId ?? null,
    category: body.category,
    titulo: body.titulo,
    resumen: body.resumen || null,
    contenido: body.contenido,
    coverUrl: body.coverUrl || null,
    published: !!body.published,
  };

  console.log('[PROXY POST /admin/pages] Clean Payload:', JSON.stringify(cleanPayload, null, 2));

  const res = await fetch(`${API_BASE}/admin/pages`, {
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
