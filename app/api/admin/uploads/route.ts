import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

/**
 * POST /api/admin/uploads
 * Proxy de subida: reenvía el body en streaming al backend sin leerlo aquí,
 * evitando el límite 413 (Payload Too Large) de Next.js/Vercel.
 * Backend: /media/upload → R2.
 *
 * FormData esperado: file (+ opcional folder, ownerType, ownerId).
 */
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type');
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Se espera multipart/form-data' }, { status: 400 });
  }

  try {
    const API_BASE = getApiUrl();
    const upstreamUrl = `${API_BASE}/media/upload`;

    // Reenviar el body en streaming (no llamar a req.formData()) para no topar con límite 413
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
      },
      body: req.body,
      ...(req.body && { duplex: 'half' } as Record<string, string>),
    });

    const raw = await upstream.text();
    console.log("[proxy POST uploads] upstream status=", upstream.status, "raw=", raw.slice(0, 200));

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: "Upstream no devolvió JSON", raw: raw.slice(0, 200), status: upstream.status },
        { status: 500 }
      );
    }

    if (!upstream.ok) {
      const errorMsg = data?.message ?? data?.error ?? "Upload falló";
      return NextResponse.json(
        { error: typeof errorMsg === "string" ? errorMsg : "Upload falló", status: upstream.status, data },
        { status: upstream.status }
      );
    }

    const publicUrl = data?.publicUrl ?? data?.url;
    if (!publicUrl || typeof publicUrl !== "string") {
      return NextResponse.json(
        { error: "Upload OK pero falta URL en respuesta", data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id ?? null,
      url: publicUrl,
      publicUrl,
      ownerType: data.ownerType ?? null,
      ownerId: data.ownerId ?? null,
      order: data.order ?? 0,
    });
  } catch (error: any) {
    console.error('[proxy POST uploads] error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}
