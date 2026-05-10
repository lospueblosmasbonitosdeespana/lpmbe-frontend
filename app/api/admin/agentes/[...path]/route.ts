import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Proxy genérico para endpoints del backend `/admin/agentes/...`.
 * Soporta GET / POST / PUT / DELETE y conserva query strings.
 *
 * El timeout es generoso (120 s en POST) porque "ejecutar ahora" puede llamar
 * a la IA y esperar hasta que el agente termine.
 */
async function forward(
  req: Request,
  method: string,
  pathParts: string[],
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const API_BASE = getApiUrl();
  const search = new URL(req.url).search;
  const upstream = `${API_BASE}/admin/agentes/${pathParts.join('/')}${search}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  let body: string | undefined;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['Content-Type'] = 'application/json';
    const raw = await req.text();
    if (raw) body = raw;
  }

  const res = await fetch(upstream, {
    method,
    headers,
    body,
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text || '{}', {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return forward(req, 'GET', (await params).path);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return forward(req, 'POST', (await params).path);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return forward(req, 'PUT', (await params).path);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return forward(req, 'DELETE', (await params).path);
}
