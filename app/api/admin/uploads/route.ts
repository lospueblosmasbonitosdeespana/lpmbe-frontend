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
    const formData = await req.formData();
    
    console.log("[proxy POST uploads] FormData keys:", Array.from(formData.keys()));

    const API_BASE = getApiUrl();
    const upstreamUrl = `${API_BASE}/admin/uploads`;

    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const raw = await upstream.text();
    console.log("[proxy POST uploads] upstream status=", upstream.status, "raw=", raw);

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Upstream no devolvió JSON", raw, status: upstream.status },
        { status: 500 }
      );
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Upload falló", status: upstream.status, data },
        { status: upstream.status }
      );
    }

    // Normaliza: nos quedamos solo con lo que usa el frontend
    // (URL string obligatoria)
    if (!data?.url || typeof data.url !== "string") {
      return NextResponse.json(
        { error: "Upload OK pero falta data.url", data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: data.url,
      filename: data.filename ?? null,
      originalName: data.originalName ?? null,
      size: data.size ?? null,
      mimetype: data.mimetype ?? null,
    });
  } catch (error: any) {
    console.error('[proxy POST uploads] error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
