import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

/** Proxy genérico: GET /admin/premios/ediciones y /admin/premios/actual */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { path } = await params;
  const subpath = path.join('/');
  const url = new URL(req.url);
  const query = url.search ? url.search : '';
  const API_BASE = getApiUrl();
  const target = `${API_BASE}/admin/premios/${subpath}${query}`;

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { path } = await params;
  const subpath = path.join('/');
  const API_BASE = getApiUrl();
  const target = `${API_BASE}/admin/premios/${subpath}`;

  try {
    const body = await req.text();
    const upstream = await fetch(target, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': req.headers.get('content-type') ?? 'application/json',
      },
      body,
    });
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { path } = await params;
  const subpath = path.join('/');
  const API_BASE = getApiUrl();
  const target = `${API_BASE}/admin/premios/${subpath}`;

  try {
    const body = await req.text();
    const upstream = await fetch(target, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': req.headers.get('content-type') ?? 'application/json',
      },
      body,
    });
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { path } = await params;
  const subpath = path.join('/');
  const API_BASE = getApiUrl();
  const target = `${API_BASE}/admin/premios/${subpath}`;

  try {
    const upstream = await fetch(target, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
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
