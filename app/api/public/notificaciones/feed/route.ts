import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function GET(req: Request) {
  try {
    const API_BASE = getApiUrl();
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ?? '50';
    const tipos = searchParams.get('tipos') ?? 'NOTICIA,EVENTO,ALERTA,ALERTA_PUEBLO,SEMAFORO';
    const lang = searchParams.get('lang') ?? req.headers.get('accept-language')?.split(',')[0]?.split('-')[0]?.trim();

    const url = new URL(`${API_BASE}/public/notificaciones/feed`);
    url.searchParams.set('limit', limit);
    url.searchParams.set('tipos', tipos);
    if (lang) url.searchParams.set('lang', lang);

    const res = await fetch(url.toString(), { cache: 'no-store' });
    
    if (!res.ok) {
      // Si el backend falla, devolver items vacío (feed público debe ser resiliente)
      return NextResponse.json({ items: [] }, { status: 200 });
    }
    
    const text = await res.text();
    
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    // Cualquier error: devolver items vacío
    console.error('[PUBLIC FEED] error:', error?.message);
    return NextResponse.json(
      { items: [], error: error?.message },
      { status: 200 }
    );
  }
}
