import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** GET /api/admin/subvenciones — listado paginado con filtros. */
export async function GET(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const API_BASE = getApiUrl();
  const search = new URL(req.url).search;
  const res = await fetch(`${API_BASE}/admin/subvenciones${search}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const text = await res.text();
  return new NextResponse(text || '{}', {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
