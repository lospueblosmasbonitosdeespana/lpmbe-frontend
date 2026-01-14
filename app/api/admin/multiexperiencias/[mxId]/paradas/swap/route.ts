import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

// POST /admin/multiexperiencias/:mxId/paradas/swap
// FORMATO UNIVERSAL: { a: { kind, legacyLugarId/customId }, b: { ... } }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ mxId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { mxId } = await params;
  
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  console.log("[proxy POST swap] mxId=", mxId, "body=", body);

  // ✅ SWAP UNIVERSAL: reenviar el body tal cual al backend
  // El backend validará el formato { a: { kind, ... }, b: { kind, ... } }
  
  if (!body || !body.a || !body.b) {
    return NextResponse.json(
      { message: 'Bad Request: se requiere { a: {...}, b: {...} }' },
      { status: 400 }
    );
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/multiexperiencias/${mxId}/paradas/swap`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await upstream.text();
    console.log("[proxy POST swap] upstream status=", upstream.status, "text=", text);

    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[proxy POST swap] fetch error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
