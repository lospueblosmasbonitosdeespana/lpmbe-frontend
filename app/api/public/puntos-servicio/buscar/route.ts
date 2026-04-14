import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function GET(request: NextRequest) {
  const API_BASE = getApiUrl();
  const tipo = request.nextUrl.searchParams.get('tipo') ?? '';
  const pueblo = request.nextUrl.searchParams.get('pueblo') ?? '';

  const qs = new URLSearchParams();
  if (tipo) qs.set('tipo', tipo);
  if (pueblo) qs.set('pueblo', pueblo);

  try {
    const res = await fetch(`${API_BASE}/public/puntos-servicio/buscar?${qs}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return NextResponse.json([], { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
