import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';

export const maxDuration = 15;

export async function GET(req: Request) {
  const token = await getToken();
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    return NextResponse.json({ message: 'URL inválida' }, { status: 400 });
  }

  try {
    const headRes = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) });
    const contentLength = headRes.headers.get('content-length');
    const contentType = headRes.headers.get('content-type');
    return NextResponse.json({
      url,
      bytes: contentLength ? Number(contentLength) : null,
      contentType: contentType || null,
    });
  } catch {
    return NextResponse.json({ url, bytes: null, contentType: null });
  }
}
