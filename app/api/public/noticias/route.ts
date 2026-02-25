import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApiUrl } from '@/lib/api';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const SUPPORTED = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const;

export async function GET(req: Request) {
  const API_BASE = getApiUrl();
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit') ?? '20';
  // lang: query param tiene prioridad sobre cookie
  const langParam = searchParams.get('lang');
  const store = await cookies();
  const locale = store.get(LOCALE_COOKIE)?.value;
  const rawLang = langParam || locale;
  const lang = rawLang && SUPPORTED.includes(rawLang as (typeof SUPPORTED)[number]) ? rawLang : undefined;
  const qs = lang ? `&lang=${encodeURIComponent(lang)}` : '';
  const upstream = await fetch(`${API_BASE}/public/noticias?limit=${limit}${qs}`, {
    cache: 'no-store',
    headers: lang ? { 'Accept-Language': lang } : undefined,
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
