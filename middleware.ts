import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

const CANONICAL_HOST = 'staging.lospueblosmasbonitosdeespana.org';
const VERCEL_HOST = 'lpmbe-frontend.vercel.app';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? '';

  // 1) Dominio canónico: si entran por Vercel → redirect 308 a staging (path + query)
  if (host === VERCEL_HOST || host.startsWith(VERCEL_HOST + ':')) {
    const url = new URL(request.url);
    url.protocol = 'https:';
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  // 2) Rutas que requieren sesión
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const rutasProtegidas =
    pathname.startsWith('/cuenta') ||
    pathname.startsWith('/mi-cuenta') ||
    pathname.startsWith('/gestion');

  if (rutasProtegidas && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/entrar';
    if (pathname.startsWith('/gestion')) {
      url.searchParams.set('from', 'gestion');
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas de página.
     * Excluye: api, _next/static, _next/image, favicon.ico, sitemap.xml, robots.txt
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
