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
    const incomingForm = await req.formData();
    const file = incomingForm.get('file');
    
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    // Crear FormData fresco para reenviar al backend (evita problemas de serialización)
    const formData = new FormData();
    formData.append('file', file, file instanceof File ? file.name : 'image');
    const folder = incomingForm.get('folder');
    if (folder && typeof folder === 'string') formData.append('folder', folder);

    const API_BASE = getApiUrl();
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
      const errorMsg = data?.message ?? data?.error ?? "Upload falló";
      return NextResponse.json(
        { error: typeof errorMsg === "string" ? errorMsg : "Upload falló", status: upstream.status, data },
        { status: upstream.status }
      );
    }

    // ✅ Normalizar respuesta del backend
    // Backend devuelve: { key, url } o { publicUrl }
    const publicUrl = data?.publicUrl ?? data?.url;
    if (!publicUrl || typeof publicUrl !== "string") {
      return NextResponse.json(
        { error: "Upload OK pero falta URL en respuesta", data },
        { status: 500 }
      );
    }

    // Compatibilidad: devolver tanto 'url' como 'publicUrl'
    return NextResponse.json({
      id: data.id ?? null,
      url: publicUrl, // ← Para componentes legacy que esperan 'url'
      publicUrl, // ← Para nuevos componentes
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
