import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import { SUPPORTED_LOCALES } from '@/lib/seo';

const CANONICAL_HOST = 'lospueblosmasbonitosdeespana.org';
const STAGING_HOST = 'staging.lospueblosmasbonitosdeespana.org';
const VERCEL_HOST = 'lpmbe-frontend.vercel.app';
const LOCALE_COOKIE = 'NEXT_LOCALE';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const host = request.headers.get('host') ?? '';

  // 1) Dominio canónico: Vercel o staging → redirect 308 al dominio principal
  if (host === VERCEL_HOST || host.startsWith(VERCEL_HOST + ':') ||
      host === STAGING_HOST || host.startsWith(STAGING_HOST + ':')) {
    const url = new URL(request.url);
    url.protocol = 'https:';
    url.host = CANONICAL_HOST;
    return NextResponse.redirect(url, 308);
  }

  // 2) /cuenta y /mi-cuenta sin cookie de sesión → redirect a /entrar (mantiene ?redirect= si existe)
  if (pathname.startsWith('/cuenta') || pathname.startsWith('/mi-cuenta')) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/entrar';
      return NextResponse.redirect(url);
    }
  }

  // 3) SEO i18n: ?lang= define el idioma para esta petición (y para crawlers). Pasar al servidor.
  const lang = searchParams.get('lang');
  const validLocale =
    lang && SUPPORTED_LOCALES.includes(lang as (typeof SUPPORTED_LOCALES)[number])
      ? lang
      : null;

  const requestHeaders = new Headers(request.headers);
  if (validLocale) {
    requestHeaders.set('x-next-locale', validLocale);
  }
  const res = NextResponse.next({ request: { headers: requestHeaders } });
  if (validLocale) {
    res.cookies.set(LOCALE_COOKIE, validLocale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  }
  return res;
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
