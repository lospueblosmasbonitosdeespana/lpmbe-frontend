import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ puebloId: string; tag: string }> },
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { puebloId, tag } = await params;
  const API_BASE = getApiUrl();

  try {
    const res = await fetch(`${API_BASE}/admin/pueblos/${puebloId}/caracteristicas/suggest/${tag}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      return NextResponse.json({ error: t }, { status: res.status });
    }
    return NextResponse.json(await res.json());
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Error' }, { status: 500 });
  }
}
