import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

const DEV_LOGS = process.env.NODE_ENV === 'development';

// GET /admin/multiexperiencias/:mxId/paradas
export async function GET(
  req: Request,
  { params }: { params: Promise<{ mxId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { mxId } = await params;
  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/multiexperiencias/${mxId}/paradas`;

  if (DEV_LOGS) {
    console.error('[admin/multiexperiencias/paradas GET] upstreamUrl:', upstreamUrl);
    console.error('[admin/multiexperiencias/paradas GET] token exists:', !!token);
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (DEV_LOGS) {
      console.error('[admin/multiexperiencias/paradas GET] upstream status:', upstream.status);
    }

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => 'Error desconocido');
      if (DEV_LOGS) {
        console.error('[admin/multiexperiencias/paradas GET] error text:', errorText);
      }
      return NextResponse.json({ error: errorText }, { status: upstream.status });
    }

    const data = await upstream.json().catch(() => []);
    return NextResponse.json(data, { status: upstream.status });
  } catch (error: any) {
    if (DEV_LOGS) {
      console.error('[admin/multiexperiencias/paradas GET] fetch error:', error);
    }

    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}

// POST /admin/multiexperiencias/:mxId/paradas (UPSERT)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ mxId: string }> }
) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { mxId } = await params;
  
  // Leer body una vez
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  console.log("[proxy POST paradas] mxId=", mxId, "body=", body);

  // ✅ ÚNICA VALIDACIÓN: titulo (string no vacío)
  // ❌ NO validar legacyLugarId (opcional para paradas CUSTOM)
  // ❌ NO validar lat/lng (pueden ser null)

  if (!body || typeof body.titulo !== 'string' || !body.titulo.trim()) {
    return NextResponse.json(
      { message: 'Bad Request: titulo es requerido' },
      { status: 400 }
    );
  }

  const API_BASE = getApiUrl();
  const upstreamUrl = `${API_BASE}/admin/multiexperiencias/${mxId}/paradas`;

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
    console.log("[proxy POST paradas] upstream status=", upstream.status, "text=", text);

    // Devolver el texto del upstream tal cual (no parsearlo)
    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[proxy POST paradas] fetch error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
