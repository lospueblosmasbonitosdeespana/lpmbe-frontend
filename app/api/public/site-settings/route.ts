import { NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const API_BASE = getApiUrl();

  try {
    const res = await fetch(`${API_BASE}/public/site-settings`, {
      cache: 'no-store',
    });

    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Fallback si el backend no responde
    return NextResponse.json({
      brandName: 'LPBME',
      activeLogo: 'text',
      logoUrl: null,
      logoAlt: 'Los Pueblos Más Bonitos de España',
      logoVariantUrl: null,
    });
  }
}
