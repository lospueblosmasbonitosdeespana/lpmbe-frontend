import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  const API_BASE = getApiUrl();
  
  try {
    const res = await fetch(`${API_BASE}/public/multiexperiencias`, {
      cache: 'no-store',
    });

    const text = await res.text();
    
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[PUBLIC MULTIEXPERIENCIAS] Error:', error);
    return NextResponse.json({ error: 'Error cargando multiexperiencias' }, { status: 500 });
  }
}
