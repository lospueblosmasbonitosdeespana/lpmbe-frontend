import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ message: 'Slug requerido' }, { status: 400 });
  }

  const apiUrl = getApiUrl();
  try {
    const res = await fetch(`${apiUrl}/public/recursos/${encodeURIComponent(slug)}`, {
      method: 'GET',
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[API proxy] GET public/recursos/slug:', err);
    return NextResponse.json(
      { message: 'Error de conexión con el servidor' },
      { status: 502 }
    );
  }
}
