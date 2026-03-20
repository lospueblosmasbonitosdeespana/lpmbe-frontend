import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const API_BASE = getApiUrl();
  const res = await fetch(`${API_BASE}/admin/pueblo-logos/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { 'Content-Type': 'application/json' } });
}
