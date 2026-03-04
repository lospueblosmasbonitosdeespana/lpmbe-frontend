import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ puebloId: string }> }
) {
  const { puebloId } = await params;
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get('lang') ?? request.headers.get('accept-language')?.split(',')[0]?.trim()?.slice(0, 2);
  const API_BASE = getApiUrl();
  const qs = lang ? `?lang=${encodeURIComponent(lang)}` : '';

  try {
    const res = await fetch(`${API_BASE}/public/pueblos/${puebloId}/pages${qs}`, {
      cache: 'no-store',
      headers: lang ? { 'Accept-Language': lang } : undefined,
    });

    const text = await res.text();
    
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`[PUEBLO PAGES ${puebloId}] Error:`, error);
    return NextResponse.json({ error: 'Error cargando páginas del pueblo' }, { status: 500 });
  }
}
