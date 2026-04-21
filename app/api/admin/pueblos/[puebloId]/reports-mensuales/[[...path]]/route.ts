import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ puebloId: string; path?: string[] }> },
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { puebloId, path } = await params;
  const subpath = path && path.length > 0 ? `/${path.join('/')}` : '';
  const url = new URL(req.url);
  const query = url.search ? url.search : '';
  const API_BASE = getApiUrl();
  const target = `${API_BASE}/admin/pueblos/${encodeURIComponent(
    puebloId,
  )}/reports-mensuales${subpath}${query}`;

  try {
    const upstream = await fetch(target, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const contentType = upstream.headers.get('content-type') ?? 'application/json';
    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: { 'content-type': contentType },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
