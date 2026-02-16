import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApiUrl } from '@/lib/api';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const SUPPORTED = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const API_BASE = getApiUrl();
  const store = await cookies();
  const locale = store.get(LOCALE_COOKIE)?.value;
  const lang = locale && SUPPORTED.includes(locale as (typeof SUPPORTED)[number]) ? locale : undefined;
  const qs = lang ? `?lang=${encodeURIComponent(lang)}` : '';
  const upstream = await fetch(`${API_BASE}/pueblos/${slug}${qs}`, {
    cache: 'no-store',
    headers: lang ? { 'Accept-Language': lang } : undefined,
  });
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
  });
}
