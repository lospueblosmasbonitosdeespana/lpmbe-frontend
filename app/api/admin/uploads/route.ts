import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

// POST /api/admin/uploads (multipart/form-data)
// Recibe archivo, devuelve { url: "https://..." }
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Obtener FormData del request
    const formData = await req.formData();
    
    console.log("[proxy POST uploads] FormData keys:", Array.from(formData.keys()));

    const API_BASE = getApiUrl();
    const upstreamUrl = `${API_BASE}/admin/uploads`;

    // Reenviar el FormData tal cual al backend
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // NO incluir Content-Type aquí, fetch lo añadirá automáticamente con el boundary correcto
      },
      body: formData,
    });

    const text = await upstream.text();
    console.log("[proxy POST uploads] upstream status=", upstream.status, "text=", text);

    return new Response(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[proxy POST uploads] error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
