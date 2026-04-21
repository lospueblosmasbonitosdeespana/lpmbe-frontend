import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

async function proxy(
  req: NextRequest,
  path: string[] | undefined,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const subpath = path && path.length > 0 ? `/${path.join('/')}` : '';
  const url = new URL(req.url);
  const query = url.search ? url.search : '';
  const API_BASE = getApiUrl();
  const target = `${API_BASE}/admin/reports-mensuales${subpath}${query}`;

  try {
    const init: RequestInit = {
      method,
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    };
    if (method !== 'GET' && method !== 'DELETE') {
      const body = await req.text();
      init.body = body;
      (init.headers as Record<string, string>)['content-type'] =
        req.headers.get('content-type') ?? 'application/json';
    }
    const upstream = await fetch(target, init);
    const contentType = upstream.headers.get('content-type') ?? 'application/json';
    const respBody = await upstream.text();
    return new NextResponse(respBody, {
      status: upstream.status,
      headers: { 'content-type': contentType },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  return proxy(req, path, 'GET');
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  return proxy(req, path, 'POST');
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  return proxy(req, path, 'PUT');
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const { path } = await params;
  return proxy(req, path, 'DELETE');
}
