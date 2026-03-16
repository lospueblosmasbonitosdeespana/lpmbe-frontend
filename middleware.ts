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
// No quitar 'lang': las URLs ?lang=en|fr|... deben devolver 200 para que hreflang no sea 3XX.
const CANONICAL_DROP_QUERY_PARAMS = new Set([
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
const SUPPORTED_LOCALES = new Set(['es', 'en', 'fr', 'de', 'pt', 'it', 'ca']);

function normalizePath(pathname: string): string {
  const lower = pathname.toLowerCase();
  if (lower !== '/' && lower.endsWith('/')) return lower.slice(0, -1);
  return lower;
}

function normalizeCanonicalPath(pathname: string): string {
  if (pathname !== '/' && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname || '/';
}

function injectLocaleCookie(cookieHeader: string | null, locale: string): string {
  const parts = (cookieHeader ?? '')
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .filter((p) => !p.toLowerCase().startsWith('next_locale='));
  parts.push(`NEXT_LOCALE=${locale}`);
  return parts.join('; ');
}

function permanentRedirect(req: NextRequest, destination: string): NextResponse {
  const url = new URL(destination, req.url);
  return NextResponse.redirect(url, 301);
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
  return NextResponse.redirect(url, 301);
}

export function middleware(req: NextRequest): NextResponse {
  const pathname = normalizePath(req.nextUrl.pathname);
  const canonicalPath = normalizeCanonicalPath(req.nextUrl.pathname);
  const normalizedSearch = normalizeSearchParams(req.nextUrl.searchParams);
  const pathWithQuery = normalizedSearch ? `${pathname}?${normalizedSearch}` : pathname;
  const idLugar = req.nextUrl.searchParams.get('id_lugar');
  const idPublicacion = req.nextUrl.searchParams.get('id_publicacion');
  const queryLang = req.nextUrl.searchParams.get('lang')?.toLowerCase();
  const cookieLang = req.cookies.get('NEXT_LOCALE')?.value?.toLowerCase();
  const activeLocale =
    (queryLang && SUPPORTED_LOCALES.has(queryLang) && queryLang) ||
    (cookieLang && SUPPORTED_LOCALES.has(cookieLang) && cookieLang) ||
    'es';

  // /app es una ruta activa para redireccion inteligente a stores.
  if (pathname === '/app') return NextResponse.next();

  // === FICHA-PUEBLO legacy WP: /ficha-pueblo/SLUG → /pueblos/SLUG (301, un solo salto) ===
  const fichaMatch = pathname.match(/^(?:\/(en|fr|de|pt|it|ca))?\/ficha-pueblo(?:\/(.+))?$/);
  if (fichaMatch) {
    const fLocale = fichaMatch[1];
    const slug = (fichaMatch[2] || '').replace(/\/$/, '');
    let target: string;
    if (slug && !slug.startsWith('[')) {
      target = `/pueblos/${slug}`;
    } else if (idLugar && LEGACY_FICHA_ID_REDIRECTS[idLugar]) {
      target = LEGACY_FICHA_ID_REDIRECTS[idLugar];
    } else {
      target = '/pueblos';
    }
    const destUrl = new URL(target, req.url);
    if (fLocale) destUrl.searchParams.set('lang', fLocale);
    return NextResponse.redirect(destUrl, 301);
  }

  // Legacy i18n con prefijo en path (/en/..., /fr/...) -> formato actual con ?lang=xx.
  const localePrefixMatch = pathname.match(/^\/(en|fr|de|pt|it|ca)(\/.*)?$/);
  if (localePrefixMatch) {
    const legacyLocale = localePrefixMatch[1];
    const restPath = normalizeCanonicalPath(localePrefixMatch[2] ?? '/');
    const destination = new URL(restPath, req.url);
    destination.searchParams.set('lang', legacyLocale);
    return NextResponse.redirect(destination, 301);
  }

  // Secciones consolidadas en /actualidad (301 en middleware para evitar 308 de permanentRedirect).
  if (pathname === '/noticias') return permanentRedirect(req, '/actualidad?tipo=NOTICIA');
  if (pathname === '/eventos') return permanentRedirect(req, '/actualidad?tipo=EVENTO');
  if (pathname === '/agenda') return permanentRedirect(req, '/actualidad?tipo=EVENTO');
  if (pathname === '/articulos') return permanentRedirect(req, '/actualidad?tipo=ARTICULO');

  // Canonicalizar legacy /c/* para evitar duplicados de contenido con /noticias/* y páginas legales.
  if (pathname.startsWith('/c/')) {
    const slug = pathname.slice(3);
    if (slug === 'contacto') return permanentRedirect(req, '/contacto');
    if (slug === 'privacidad') return permanentRedirect(req, '/privacidad');
    if (slug === 'aviso-legal') return permanentRedirect(req, '/aviso-legal');
    if (slug === 'cookies') return permanentRedirect(req, '/cookies');
    if (slug) return permanentRedirect(req, `/noticias/${slug}`);
  }

  // URLs basura (WP feeds, assets, noticias-y-eventos sin id): redirigir a home o actualidad.
  if (pathname.endsWith('/feed') || pathname.endsWith('/feed/')) return permanentRedirect(req, '/');
  if (pathname.startsWith('/wp-content/') || pathname.startsWith('/wp-includes/')) return permanentRedirect(req, '/');
  if (pathname === '/noticias-y-eventos') return permanentRedirect(req, '/actualidad');
  if (/^\/noticias-y-eventos\/\d+$/.test(pathname)) return permanentRedirect(req, '/actualidad');
  // WP date archives (informe noindex GSC): /2025/07, /2026/01/19, etc.
  if (/^\/20(25|26)\/\d{2}(\/\d{2})?$/.test(pathname)) return permanentRedirect(req, '/actualidad');
  // WP category (informe noindex GSC): /category/office, etc.
  if (pathname.startsWith('/category/')) return permanentRedirect(req, '/tienda');
  // Taxonomías/tag legacy de WordPress.
  if (pathname.startsWith('/tag/')) return permanentRedirect(req, '/actualidad');
  if (pathname.startsWith('/categoria/')) return permanentRedirect(req, '/actualidad');
  if (pathname.startsWith('/categoria-producto/')) return permanentRedirect(req, '/tienda');
  if (pathname.startsWith('/producto/')) return permanentRedirect(req, '/tienda');
  if (pathname.startsWith('/tiendapueblos')) return permanentRedirect(req, '/tienda');
  if (pathname.startsWith('/author/')) return permanentRedirect(req, '/actualidad');
  if (pathname === '/author') return permanentRedirect(req, '/actualidad');
  // Legacy login/proxy (informe noindex GSC).
  if (pathname === '/wp-login.php' || pathname === '/proxy-oauth') return permanentRedirect(req, '/entrar');
  // Folletos físicos con QR legacy de Pirineos.
  if (pathname === '/pueblos-bonitos-pirineos') {
    return permanentRedirect(req, '/rutas/mas-bonitos-de-los-pirineos');
  }

  // URLs reportadas por Search Console como 404/Gone: enviar a home.
  if (
    SEARCH_CONSOLE_404_PATHS.has(pathname) ||
    SEARCH_CONSOLE_404_WITH_QUERY.has(pathWithQuery)
  ) {
    return permanentRedirect(req, '/');
  }

  // Casos legacy con querystring (WP antiguo)
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

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-current-path', canonicalPath);
  requestHeaders.set('x-current-locale', activeLocale);
  if (queryLang && SUPPORTED_LOCALES.has(queryLang)) {
    const currentCookie = requestHeaders.get('cookie');
    requestHeaders.set('cookie', injectLocaleCookie(currentCookie, queryLang));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
};
