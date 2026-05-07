import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Reenvía multipart/form-data al backend (no usa proxyToBackend porque ese helper
 * solo soporta JSON). Acepta `file` y opcionalmente `pieFoto_es`.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const formData = await req.formData();

  const upstream = await fetch(`${getApiUrl()}/admin/grandes-eventos/${id}/fotos/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData as unknown as BodyInit,
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    return NextResponse.json({ error: text }, { status: upstream.status });
  }
  return NextResponse.json(text ? JSON.parse(text) : {}, { status: upstream.status });
}
