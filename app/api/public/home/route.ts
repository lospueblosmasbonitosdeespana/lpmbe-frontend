import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const API_BASE = getApiUrl();
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get('lang');

  try {
    const qs = lang ? `?lang=${encodeURIComponent(lang)}` : '';
    const res = await fetch(`${API_BASE}/home${qs}`, {
      cache: 'no-store',
      headers: lang ? { 'Accept-Language': lang } : undefined,
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return NextResponse.json({});
  }
}
