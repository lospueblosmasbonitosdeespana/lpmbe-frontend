import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

/**
 * POST /api/media/upload
 * Proxy de subida: reenvía el body en STREAMING al backend sin leerlo aquí,
 * evitando el límite 413 / 405 (Payload Too Large) de Vercel (~4.5MB).
 * Backend: /media/upload → R2 (donde se optimiza a ≤5MB si hace falta).
 *
 * FormData esperado: file (+ opcional folder, puebloId, rutaId).
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

    // Reenviar el body en streaming (NO llamar a req.formData()) para no topar con límite de Vercel
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

    let data: any;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: 'Backend no devolvió JSON', raw: raw.slice(0, 200), status: upstream.status },
        { status: 500 },
      );
    }

    if (!upstream.ok) {
      const errorMsg = data?.message ?? data?.error ?? 'Upload falló';
      return NextResponse.json(
        { error: typeof errorMsg === 'string' ? errorMsg : 'Upload falló', status: upstream.status, data },
        { status: upstream.status },
      );
    }

    const publicUrl = data?.publicUrl ?? data?.url;
    if (!publicUrl || typeof publicUrl !== 'string') {
      return NextResponse.json(
        { error: 'Upload OK pero falta URL en respuesta', data },
        { status: 500 },
      );
    }

    return NextResponse.json({
      id: data.id ?? null,
      url: publicUrl,
      publicUrl,
      key: data.key ?? null,
    });
  } catch (error: any) {
    console.error('[proxy POST media/upload] error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 },
    );
  }
}
