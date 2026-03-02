import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/seo';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ puebloId: string }> },
) {
  const API_BASE = getApiUrl();
  const { puebloId } = await params;
  const { searchParams } = new URL(req.url);

  const qs = new URLSearchParams();
  if (searchParams.get('tipo')) qs.set('tipo', searchParams.get('tipo')!);
  if (searchParams.get('limit')) qs.set('limit', searchParams.get('limit')!);
  if (searchParams.get('cursor')) qs.set('cursor', searchParams.get('cursor')!);

  const rawLang = searchParams.get('lang');
  const lang =
    rawLang && SUPPORTED_LOCALES.includes(rawLang as SupportedLocale)
      ? rawLang
      : undefined;
  if (lang) qs.set('lang', lang);

  const query = qs.toString() ? `?${qs.toString()}` : '';
  const upstream = await fetch(
    `${API_BASE}/public/pueblos/${puebloId}/archivo${query}`,
    {
      cache: 'no-store',
      headers: lang ? { 'Accept-Language': lang } : undefined,
    },
  );

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
