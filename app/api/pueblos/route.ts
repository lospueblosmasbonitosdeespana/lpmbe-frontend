import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function GET(req: Request) {
  const API_BASE = getApiUrl();
  
  // Extraer parámetros de búsqueda
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  
  // Construir URL con query params
  let url = `${API_BASE}/pueblos`;
  if (search) {
    url += `?search=${encodeURIComponent(search)}`;
  }
  
  const upstream = await fetch(url, {
    cache: 'no-store',
  });

  const text = await upstream.text();
  
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
    },
  });
}

