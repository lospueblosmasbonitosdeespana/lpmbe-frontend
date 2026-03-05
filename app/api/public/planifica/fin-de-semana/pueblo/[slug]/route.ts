import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

const SUPPORTED = ['es', 'en', 'fr', 'de', 'pt', 'it', 'ca'] as const;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const API_BASE = getApiUrl();
  const url = new URL(req.url);
  const lang = url.searchParams.get('lang');
  const qs = lang && SUPPORTED.includes(lang as (typeof SUPPORTED)[number]) ? `?lang=${lang}` : '';

  const res = await fetch(
    `${API_BASE}/public/planifica/fin-de-semana/pueblo/${encodeURIComponent(slug)}${qs}`,
    { cache: 'no-store' }
  );

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
