import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function forward(req: Request, method: string, id: string) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const API_BASE = getApiUrl();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  let body: string | undefined;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['Content-Type'] = 'application/json';
    const raw = await req.text();
    if (raw) body = raw;
  }
  const res = await fetch(`${API_BASE}/admin/subvenciones/${id}`, {
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
  { params }: { params: Promise<{ id: string }> },
) {
  return forward(req, 'GET', (await params).id);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return forward(req, 'PATCH', (await params).id);
}
