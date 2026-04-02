import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import { fetchWithTimeout } from '@/lib/fetch-safe';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = await getToken();
  if (!token) return NextResponse.json({ count: 0 });

  const API_BASE = getApiUrl();
  try {
    const res = await fetchWithTimeout(`${API_BASE}/admin/documentos-pueblo/destacados-count`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
