import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

/**
 * POST /api/admin/uploads/press-attachment
 * Proxy streaming al backend para subir adjuntos de notas de prensa a R2.
 * Acepta: vídeo, audio, PDF, Word, Excel, PowerPoint, ZIP, CSV, imágenes.
 * Límite: 12MB.
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
    const upstream = await fetch(`${API_BASE}/media/upload-press-attachment`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
      },
      body: req.body,
      ...(req.body && { duplex: 'half' } as Record<string, string>),
    });

    const raw = await upstream.text();

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: 'Backend no devolvió JSON', raw: raw.slice(0, 200) },
        { status: 500 },
      );
    }

    if (!upstream.ok) {
      const msg = data?.message ?? data?.error ?? 'Error subiendo adjunto';
      return NextResponse.json(
        { error: typeof msg === 'string' ? msg : 'Error subiendo adjunto' },
        { status: upstream.status },
      );
    }

    const url = data?.publicUrl ?? data?.url;
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Upload OK pero falta URL en respuesta' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      url,
      publicUrl: url,
      originalName: data.originalName ?? null,
      contentType: data.contentType ?? null,
      size: data.size ?? null,
    });
  } catch (err: unknown) {
    console.error('[upload press-attachment] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error interno' },
      { status: 500 },
    );
  }
}
