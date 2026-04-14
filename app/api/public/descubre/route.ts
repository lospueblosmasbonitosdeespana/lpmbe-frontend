import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export async function GET() {
  const API_BASE = getApiUrl();
  try {
    const res = await fetch(`${API_BASE}/public/descubre?lang=es`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.json([], { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}
