import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export const revalidate = 300;

export async function GET() {
  const API_BASE = getApiUrl();
  try {
    const res = await fetch(`${API_BASE}/public/explorar/counts`, {
      next: { revalidate: 300 },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[EXPLORAR COUNTS BFF] Error:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
