import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const API_BASE = getApiUrl();

  try {
    const res = await fetch(`${API_BASE}/public/static-pages/${encodeURIComponent(key)}`, {
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ key, titulo: key, contenido: null });
  }
}
