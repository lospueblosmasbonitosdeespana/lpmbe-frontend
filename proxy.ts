import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

const CANONICAL_HOST = 'staging.lospueblosmasbonitosdeespana.org';
const VERCEL_HOST = 'lpmbe-frontend.vercel.app';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get('host') ?? '';

  // 1) Dominio canónico: si entran por Vercel → redirect 308 a staging
  if (host === VERCEL_HOST || host.startsWith(VERCEL_HOST + ':')) {
    const url = new URL(req.url);
    url.protocol = 'https:';
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  // 2) /cuenta sin cookie → redirect a /entrar
  if (pathname.startsWith('/cuenta')) {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/entrar';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};

