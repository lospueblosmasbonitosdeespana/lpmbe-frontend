import { NextRequest, NextResponse } from 'next/server';
import {
  LEGACY_DIRECT_REDIRECTS,
  LEGACY_EXACT_GONE_PATHS,
  LEGACY_EXPERIENCIAS_ID_REDIRECTS,
  LEGACY_FICHA_ID_REDIRECTS,
  LEGACY_NOTICIA_ID_REDIRECTS,
  LEGACY_SEMAFORO_ID_REDIRECTS,
} from './lib/legacy-seo.generated';
import {
  SEARCH_CONSOLE_404_PATHS,
  SEARCH_CONSOLE_404_WITH_QUERY,
} from './lib/search-console-legacy-404';

const EXACT_GONE_PATHS = new Set(LEGACY_EXACT_GONE_PATHS);
const CANONICAL_DROP_QUERY_PARAMS = new Set([
  'lang',
  'fbclid',
  'fb_comment_id',
  'gclid',
  'tblci',
  'ref',
  'at_medium',
  'at_campaign',
  'at_platform',
  'at_creation',
  '_thumbnail_id',
  'channel',
  'amp',
  'app',
  'add-to-cart',
  'add_to_wishlist',
  'remove_item',
  '_wpnonce',
]);

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

function normalizeSearchParams(searchParams: URLSearchParams): string {
  const entries = [...searchParams.entries()].sort((a, b) => {
    if (a[0] === b[0]) return a[1].localeCompare(b[1]);
    return a[0].localeCompare(b[0]);
  });
  return new URLSearchParams(entries).toString();
}

function stripNonCanonicalParams(req: NextRequest): NextResponse | null {
  const url = req.nextUrl.clone();
  let changed = false;
  const keys = [...url.searchParams.keys()];

  for (const key of keys) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.startsWith('utm_') || CANONICAL_DROP_QUERY_PARAMS.has(lowerKey)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }

  if (!changed) return null;
  return NextResponse.redirect(url, 308);
}

export function middleware(req: NextRequest): NextResponse {
  const pathname = normalizePath(req.nextUrl.pathname);
  const normalizedSearch = normalizeSearchParams(req.nextUrl.searchParams);
  const pathWithQuery = normalizedSearch ? `${pathname}?${normalizedSearch}` : pathname;
  const idLugar = req.nextUrl.searchParams.get('id_lugar');
  const idPublicacion = req.nextUrl.searchParams.get('id_publicacion');

  // /app es una ruta activa para redireccion inteligente a stores.
  if (pathname === '/app') return NextResponse.next();

  // URLs basura (WP feeds, assets, noticias-y-eventos sin id): redirigir a home o actualidad.
  if (pathname.endsWith('/feed') || pathname.endsWith('/feed/')) return permanentRedirect(req, '/');
  if (pathname.startsWith('/wp-content/') || pathname.startsWith('/wp-includes/')) return permanentRedirect(req, '/');
  if (pathname === '/noticias-y-eventos') return permanentRedirect(req, '/actualidad');
  if (/^\/noticias-y-eventos\/\d+$/.test(pathname)) return permanentRedirect(req, '/actualidad');
  // WP date archives (informe noindex GSC): /2025/07, /2026/01/19, etc.
  if (/^\/20(25|26)\/\d{2}(\/\d{2})?$/.test(pathname)) return permanentRedirect(req, '/actualidad');
  // WP category (informe noindex GSC): /category/office, etc.
  if (pathname.startsWith('/category/')) return permanentRedirect(req, '/tienda');
  // Legacy login/proxy (informe noindex GSC).
  if (pathname === '/wp-login.php' || pathname === '/proxy-oauth') return permanentRedirect(req, '/entrar');

  // ficha-pueblo con segmento (ej. /ficha-pueblo/[lpbe_link_semaforo]): enlace roto con placeholder → listado
  if (pathname.startsWith('/ficha-pueblo/')) return permanentRedirect(req, '/pueblos');

  // URLs reportadas por Search Console como 404/Gone: enviar a home.
  if (
    SEARCH_CONSOLE_404_PATHS.has(pathname) ||
    SEARCH_CONSOLE_404_WITH_QUERY.has(pathWithQuery)
  ) {
    return permanentRedirect(req, '/');
  }

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

  // Eliminar query params de tracking/legacy para consolidar canónicas.
  const strippedParamsRedirect = stripNonCanonicalParams(req);
  if (strippedParamsRedirect) return strippedParamsRedirect;

  // Redirecciones legacy con equivalente actual.
  const redirectTarget = LEGACY_DIRECT_REDIRECTS[pathname];
  if (redirectTarget) return permanentRedirect(req, redirectTarget);

  // URLs antiguas sin reemplazo: redirigir a home para evitar 404/410 en el rastreo.
  if (EXACT_GONE_PATHS.has(pathname)) return permanentRedirect(req, '/');

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
};
