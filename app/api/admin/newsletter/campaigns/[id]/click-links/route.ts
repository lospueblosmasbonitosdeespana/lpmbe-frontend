import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const API_BASE = getApiUrl();
    const [clicksRes, timelineRes] = await Promise.all([
      fetch(`${API_BASE}/admin/newsletter/campaigns/${id}/click-links`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
      fetch(`${API_BASE}/admin/newsletter/campaigns/${id}/timeline`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      }),
    ]);
    const clicks = await clicksRes.json().catch(() => []);
    const timeline = await timelineRes.json().catch(() => []);
    return NextResponse.json({ clicks, timeline });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Error interno' }, { status: 500 });
  }
}
