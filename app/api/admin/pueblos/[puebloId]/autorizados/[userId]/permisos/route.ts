import { NextResponse, NextRequest } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ puebloId: string; userId: string }> },
) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { puebloId, userId } = await params;
  const body = await req.text();

  const upstream = await fetch(
    `${getApiUrl()}/admin/pueblos/${puebloId}/autorizados/${userId}/permisos`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
      cache: 'no-store',
    },
  );

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
