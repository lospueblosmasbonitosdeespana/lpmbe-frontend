import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  const API_BASE = getApiUrl();
  
  try {
    const url = category 
      ? `${API_BASE}/public/pages?category=${category}`
      : `${API_BASE}/public/pages`;
      
    const res = await fetch(url, {
      cache: 'no-store',
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
