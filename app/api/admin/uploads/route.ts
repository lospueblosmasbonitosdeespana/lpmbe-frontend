import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

/**
 * POST /api/admin/uploads
 * Proxy unificado para subida de archivos.
 * Redirige al backend /media/upload que gestiona Cloudflare R2.
 * 
 * FormData esperado:
 * - file: archivo a subir
 * - ownerType: tipo de entidad (pueblo, poi, producto, etc.)
 * - ownerId: ID de la entidad
 */
export async function POST(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    
    console.log("[proxy POST uploads] FormData keys:", Array.from(formData.keys()));

    const API_BASE = getApiUrl();
    // ✅ Usar /media/upload en vez de /admin/uploads (legacy)
    const upstreamUrl = `${API_BASE}/media/upload`;

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

    // ✅ Normalizar respuesta del backend
    // Backend media/upload devuelve: { key, url }
    const fileUrl = data?.publicUrl ?? data?.url;
    if (!fileUrl || typeof fileUrl !== "string") {
      return NextResponse.json(
        { error: "Upload OK pero falta URL del archivo", data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data.id ?? null,
      url: fileUrl,
      publicUrl: fileUrl,
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
