import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CANONICAL_HOST = 'staging.lospueblosmasbonitosdeespana.org';
const VERCEL_HOST = 'lpmbe-frontend.vercel.app';

export function middleware(request: NextRequest) {
  const host = request.nextUrl.hostname;

  if (host === VERCEL_HOST) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
