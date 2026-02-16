import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getApiUrl } from '@/lib/api';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const SUPPORTED = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const;

export async function GET(req: Request) {
  const API_BASE = getApiUrl();
  const { searchParams } = new URL(req.url);

  const params = new URLSearchParams();
  if (searchParams.get('scope')) params.set('scope', searchParams.get('scope')!);
  if (searchParams.get('tipo')) params.set('tipo', searchParams.get('tipo')!);
  if (searchParams.get('puebloId')) params.set('puebloId', searchParams.get('puebloId')!);
  if (searchParams.get('limit')) params.set('limit', searchParams.get('limit')!);
  const store = await cookies();
  const locale = store.get(LOCALE_COOKIE)?.value;
  const lang = locale && SUPPORTED.includes(locale as (typeof SUPPORTED)[number]) ? locale : undefined;
  if (lang) params.set('lang', lang);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const upstream = await fetch(`${API_BASE}/public/contenidos${queryString}`, {
    cache: 'no-store',
    headers: lang ? { 'Accept-Language': lang } : undefined,
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
