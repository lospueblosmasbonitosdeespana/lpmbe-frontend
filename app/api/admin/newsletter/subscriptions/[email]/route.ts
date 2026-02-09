import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { email } = await params;
  if (!email) {
    return NextResponse.json({ message: 'Email requerido' }, { status: 400 });
  }

  try {
    const API_BASE = getApiUrl();
    const encoded = encodeURIComponent(email);
    const res = await fetch(`${API_BASE}/admin/newsletter/subscriptions/${encoded}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
