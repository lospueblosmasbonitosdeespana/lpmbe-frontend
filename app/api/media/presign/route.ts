import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export async function POST(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const fileName = typeof body?.fileName === 'string' ? body.fileName : '';
  const contentType = typeof body?.contentType === 'string' ? body.contentType : '';
  const folder = typeof body?.folder === 'string' ? body.folder : undefined;

  if (!fileName || !contentType) {
    return NextResponse.json(
      { error: 'fileName y contentType son obligatorios' },
      { status: 400 },
    );
  }

  try {
    const API_BASE = getApiUrl();
    const upstream = await fetch(`${API_BASE}/media/presign`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName, contentType, folder }),
      cache: 'no-store',
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const msg = data?.message ?? data?.error ?? 'No se pudo generar URL de subida';
      return NextResponse.json(
        { error: typeof msg === 'string' ? msg : 'No se pudo generar URL de subida' },
        { status: upstream.status },
      );
    }

    return NextResponse.json({
      uploadUrl: data?.uploadUrl,
      publicUrl: data?.publicUrl,
      contentType: data?.contentType ?? contentType,
      key: data?.key ?? null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 },
    );
  }
}
