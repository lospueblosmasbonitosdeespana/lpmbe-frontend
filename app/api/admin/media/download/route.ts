import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';

export const maxDuration = 60;

function sanitizeFilename(input: string): string {
  const cleaned = input.replace(/[^a-zA-Z0-9._-]/g, '_');
  return cleaned.length ? cleaned : `foto-${Date.now()}.jpg`;
}

function inferFilenameFromUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    const last = u.pathname.split('/').filter(Boolean).pop() || '';
    return sanitizeFilename(last || `foto-${Date.now()}.jpg`);
  } catch {
    return `foto-${Date.now()}.jpg`;
  }
}

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url')?.trim();
  const requestedFilename = searchParams.get('filename')?.trim();

  if (!targetUrl) {
    return NextResponse.json({ message: 'Falta parámetro url' }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return NextResponse.json({ message: 'URL inválida' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return NextResponse.json({ message: 'Protocolo no permitido' }, { status: 400 });
  }

  try {
    const upstream = await fetch(parsed.toString(), { cache: 'no-store' });
    if (!upstream.ok) {
      return NextResponse.json({ message: `No se pudo descargar (${upstream.status})` }, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const buffer = await upstream.arrayBuffer();
    const filename = sanitizeFilename(requestedFilename || inferFilenameFromUrl(parsed.toString()));

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Error descargando archivo' }, { status: 500 });
  }
}

