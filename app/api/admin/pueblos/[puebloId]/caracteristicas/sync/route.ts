import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ puebloId: string }> },
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { puebloId } = await params;
  const body = await req.json().catch(() => null);
  const API_BASE = getApiUrl();

  try {
    const res = await fetch(`${API_BASE}/admin/pueblos/${puebloId}/caracteristicas/sync`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
