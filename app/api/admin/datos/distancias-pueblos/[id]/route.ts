import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const API_BASE = getApiUrl();

  try {
    const upstream = await fetch(
      `${API_BASE}/admin/datos/distancias-pueblos/${id}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => 'Error');
      return NextResponse.json({ error: text }, { status: upstream.status });
    }

    return NextResponse.json(await upstream.json());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
