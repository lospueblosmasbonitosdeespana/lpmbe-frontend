import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

type Ctx = { params: Promise<{ id: string; action: string }> };

const ALLOWED_ACTIONS = new Set([
  'schedule',
  'unschedule',
  'duplicate',
  'send-now',
]);

export async function POST(req: NextRequest, ctx: Ctx) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const { id, action } = await ctx.params;
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ message: 'Acción inválida' }, { status: 400 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const API_BASE = getApiUrl();
    const res = await fetch(
      `${API_BASE}/admin/newsletter/drafts/${id}/${action}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body || {}),
        cache: 'no-store',
      },
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Error' }, { status: 500 });
  }
}
