import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const API_BASE = getApiUrl();
  
  try {
    const res = await fetch(`${API_BASE}/public/pueblos/${slug}/pages`, {
      cache: 'no-store',
    });

    const text = await res.text();
    
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`[PUEBLO PAGES ${slug}] Error:`, error);
    return NextResponse.json({ error: 'Error cargando páginas del pueblo' }, { status: 500 });
  }
}
