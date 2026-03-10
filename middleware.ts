import { NextRequest, NextResponse } from 'next/server';
import {
  LEGACY_DIRECT_REDIRECTS,
  LEGACY_EXACT_GONE_PATHS,
  LEGACY_EXPERIENCIAS_ID_REDIRECTS,
  LEGACY_FICHA_ID_REDIRECTS,
  LEGACY_NOTICIA_ID_REDIRECTS,
  LEGACY_SEMAFORO_ID_REDIRECTS,
} from './lib/legacy-seo.generated';

const EXACT_GONE_PATHS = new Set(LEGACY_EXACT_GONE_PATHS);

function normalizePath(pathname: string): string {
  const lower = pathname.toLowerCase();
  if (lower !== '/' && lower.endsWith('/')) return lower.slice(0, -1);
  return lower;
}

function permanentRedirect(req: NextRequest, destination: string): NextResponse {
  const url = new URL(destination, req.url);
  // 308 = redireccion permanente (equivalente SEO de 301 para Google).
  return NextResponse.redirect(url, 308);
}

function gone(): NextResponse {
  return new NextResponse('Gone', {
    status: 410,
    headers: {
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

export function middleware(req: NextRequest): NextResponse {
  const pathname = normalizePath(req.nextUrl.pathname);
  const idLugar = req.nextUrl.searchParams.get('id_lugar');
  const idPublicacion = req.nextUrl.searchParams.get('id_publicacion');

  // /app es una ruta activa para redireccion inteligente a stores.
  if (pathname === '/app') return NextResponse.next();

  // Casos legacy con querystring (WP antiguo)
  if (pathname === '/ficha-pueblo' && idLugar) {
    const target = LEGACY_FICHA_ID_REDIRECTS[idLugar];
    if (target) return permanentRedirect(req, target);
  }
  if (pathname === '/semaforo' && idLugar) {
    const target = LEGACY_SEMAFORO_ID_REDIRECTS[idLugar];
    if (target) return permanentRedirect(req, target);
  }
  if (pathname === '/experiencias-public' && idLugar) {
    const target = LEGACY_EXPERIENCIAS_ID_REDIRECTS[idLugar];
    if (target) return permanentRedirect(req, target);
  }
  if (pathname === '/noticias-y-eventos' && idPublicacion) {
    const target = LEGACY_NOTICIA_ID_REDIRECTS[idPublicacion];
    if (target) return permanentRedirect(req, target);
  }

  // Redirecciones legacy con equivalente actual.
  const redirectTarget = LEGACY_DIRECT_REDIRECTS[pathname];
  if (redirectTarget) return permanentRedirect(req, redirectTarget);

  // URLs antiguas sin reemplazo: responder 410 para desindexado limpio.
  if (EXACT_GONE_PATHS.has(pathname)) return gone();

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
};
