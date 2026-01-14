import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

// DELETE /admin/multiexperiencias/:mxId/paradas/:customId (CUSTOM parada)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ mxId: string; customId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { mxId, customId } = await params;
  
  console.log("[proxy DELETE custom parada] mxId=", mxId, "customId=", customId);

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/multiexperiencias/${mxId}/paradas/${customId}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const text = await upstream.text();
    console.log("[proxy DELETE custom parada] upstream status=", upstream.status, "text=", text);

    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[proxy DELETE custom parada] fetch error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
