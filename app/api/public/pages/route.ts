import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const lang = searchParams.get('lang') ?? request.headers.get('accept-language')?.split(',')[0]?.trim()?.slice(0, 2);

  const API_BASE = getApiUrl();
  const qs = new URLSearchParams();
  if (category) qs.set('category', category);
  if (lang) qs.set('lang', lang);

  try {
    const url = `${API_BASE}/public/pages${qs.toString() ? `?${qs.toString()}` : ''}`;

    const res = await fetch(url, {
      cache: 'no-store',
      headers: lang ? { 'Accept-Language': lang } : undefined,
    });

    // Devolver tal cual el backend: { asociacion, pueblos }
    const text = await res.text();
    
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[PUBLIC PAGES] Error:', error);
    return NextResponse.json({ error: 'Error cargando páginas' }, { status: 500 });
  }
}
