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
  'pueblos',
  'order',
  'id_category',
  'controller',
  '_facet_cas_client_secteurs',
  'at_medim',
  'multiexperiencia_id',
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

/** 301 al destino; si la petición trae ?lang= (no-ES), lo copia al destino para no perder idioma. */
function permanentRedirectPreservingLang(req: NextRequest, destination: string): NextResponse {
  const url = new URL(destination, req.url);
  const lang = req.nextUrl.searchParams.get('lang')?.toLowerCase();
  if (lang && SUPPORTED_LOCALES.has(lang) && lang !== 'es' && !url.searchParams.has('lang')) {
    url.searchParams.set('lang', lang);
  }
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
  // www → non-www (evitar contenido duplicado)
  const host = req.headers.get('host') ?? '';
  if (host.startsWith('www.')) {
    const url = req.nextUrl.clone();
    url.host = host.replace(/^www\./, '');
    return NextResponse.redirect(url, 301);
  }

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

  // === Legacy WP ruta pages: /ruta-*, /ruta_*, multi-word route pages ===
  if (/^\/ruta[-_]/.test(pathname)) return permanentRedirect(req, '/rutas');
  if (/^\/mas-bonitos-de-los-pirineos/.test(pathname)) return permanentRedirect(req, '/rutas');
  if (/^\/pueblos-del-sol-y-la-tramuntana/.test(pathname)) return permanentRedirect(req, '/rutas');
  if (/^\/el-pirineo-catalan-y-sus-pueblos-mas-bonitos/.test(pathname)) return permanentRedirect(req, '/rutas');
  if (/^\/medievo-en-estado-puro-al-sur-de-aragon/.test(pathname)) return permanentRedirect(req, '/rutas');
  if (/^\/ruta-los-nazaries/.test(pathname)) return permanentRedirect(req, '/rutas');

  // Legacy WP misc patterns.
  if (pathname.startsWith('/about-us')) return permanentRedirect(req, '/el-sello');
  if (pathname.startsWith('/blog/')) return permanentRedirect(req, '/actualidad');
  if (pathname === '/blog') return permanentRedirect(req, '/actualidad');
  if (pathname === '/register' || pathname === '/password-reset' || pathname === '/test') return permanentRedirect(req, '/');
  if (pathname === '/notifications') return permanentRedirect(req, '/');
  if (pathname === '/finalizar-compra' || pathname === '/carrito') return permanentRedirect(req, '/tienda');
  if (pathname === '/semaforo') return permanentRedirect(req, '/pueblos');
  if (pathname === '/michelin-mapa-lpmbe') return permanentRedirect(req, '/tienda');
  if (/^\/certificacion-/.test(pathname)) return permanentRedirect(req, '/el-sello');
  if (/^\/asamblea-/.test(pathname)) return permanentRedirect(req, '/actualidad');
  if (/^\/andalucia\//.test(pathname) || /^\/cantabria\//.test(pathname)) return permanentRedirect(req, '/pueblos');
  if (pathname === '/sa') return permanentRedirect(req, '/');
  if (/^\/pueblo-/.test(pathname) || pathname === '/pueblo----') return permanentRedirect(req, '/pueblos');
  if (/^\/10-/.test(pathname) || pathname === '/10-anos') return permanentRedirect(req, '/actualidad');

  // Secciones consolidadas en /actualidad (301 en middleware para evitar 308 de permanentRedirect).
  if (pathname === '/noticias') return permanentRedirectPreservingLang(req, '/actualidad?tipo=noticia');
  if (pathname === '/eventos') return permanentRedirectPreservingLang(req, '/actualidad?tipo=evento');
  if (pathname === '/agenda') return permanentRedirectPreservingLang(req, '/actualidad?tipo=evento');
  if (pathname === '/articulos') return permanentRedirectPreservingLang(req, '/actualidad?tipo=articulo');

  // Slug legal WordPress → página actual (no enviar al home por listas GSC legacy).
  if (pathname === '/politica-privacidad' || pathname === '/politica-de-privacidad') {
    return permanentRedirectPreservingLang(req, '/privacidad');
  }
  if (pathname === '/asociacion') {
    return permanentRedirectPreservingLang(req, '/el-sello');
  }

  // URLs basura (WP feeds, assets, noticias-y-eventos sin id): redirigir a home o actualidad.
  if (pathname.endsWith('/feed') || pathname.endsWith('/feed/')) return permanentRedirect(req, '/');
  if (pathname.startsWith('/wp-content/') || pathname.startsWith('/wp-includes/')) return permanentRedirect(req, '/');
  if (pathname === '/noticias-y-eventos') return permanentRedirectPreservingLang(req, '/actualidad');
  if (/^\/noticias-y-eventos\/\d+$/.test(pathname)) return permanentRedirect(req, '/actualidad');
  // WP date archives (informe noindex GSC): /2024/05/06, /2025/07, /2026/01/19, etc.
  if (/^\/20(24|25|26)\/\d{2}(\/\d{2})?$/.test(pathname)) return permanentRedirect(req, '/actualidad');
  // WP theme cruft: /pf/*, /services/*, /projects/* — all redirect to home.
  if (pathname.startsWith('/pf/')) return permanentRedirect(req, '/');
  if (pathname.startsWith('/services/')) return permanentRedirect(req, '/');
  if (pathname.startsWith('/projects/') || pathname === '/projects-page') return permanentRedirect(req, '/');
  // /lpmbe/ prefix legacy: strip prefix and re-process (e.g. /lpmbe/ficha-pueblo/?id_lugar=65).
  if (pathname.startsWith('/lpmbe/')) {
    const stripped = pathname.replace(/^\/lpmbe/, '');
    const dest = new URL(stripped || '/', req.url);
    req.nextUrl.searchParams.forEach((v, k) => dest.searchParams.set(k, v));
    return NextResponse.redirect(dest, 301);
  }
  // WP category (informe noindex GSC): /category/office, etc.
  // Caso especial detectado en auditoria: /category/rutas debe consolidar a /rutas.
  if (pathname === '/category/rutas') return permanentRedirect(req, '/rutas');
  if (pathname.startsWith('/category/')) return permanentRedirect(req, '/tienda');
  // Taxonomías/tag legacy de WordPress.
  if (pathname.startsWith('/tag/')) return permanentRedirect(req, '/actualidad');
  if (pathname.startsWith('/categoria/')) return permanentRedirect(req, '/actualidad');
  if (pathname.startsWith('/categoria-producto/')) return permanentRedirect(req, '/tienda');
  if (pathname.startsWith('/producto/')) return permanentRedirect(req, '/tienda');
  if (pathname.startsWith('/tiendapueblos')) return permanentRedirect(req, '/tienda');
  if (pathname.startsWith('/planifica/la-noche-romantica')) return permanentRedirect(req, '/noche-romantica');
  if (pathname.startsWith('/author/')) return permanentRedirect(req, '/actualidad');
  if (pathname === '/author') return permanentRedirect(req, '/actualidad');
  // Legacy login/proxy (informe noindex GSC + Sitebulb).
  // NOTA: /gestion es una ruta activa (panel admin), NO redirigir.
  if (pathname === '/wp-login.php' || pathname === '/proxy-oauth') return permanentRedirect(req, '/entrar');
  // Folletos físicos con QR legacy de Pirineos.
  if (pathname === '/pueblos-bonitos-pirineos') {
    return permanentRedirect(req, '/rutas/mas-bonitos-de-los-pirineos');
  }

  // /account/*, /user/* → private pages, redirect to home.
  if (pathname.startsWith('/account/') || pathname === '/account') return permanentRedirect(req, '/');
  if (pathname.startsWith('/user/')) return permanentRedirect(req, '/');
  // /notificaciones y /alertas son páginas públicas (no indexables pero accesibles).

  // Orphan sub-paths under /pueblos/SLUG/ that don't have real pages.
  // multiexperiencias, videos y categoria/[cat] SÍ tienen páginas reales — NO redirigir.
  // Solo redirigir /pueblos/SLUG/categoria (sin subcategoría) que no tiene page.tsx.
  if (/^\/pueblos\/([^/]+)\/categoria$/.test(pathname)) {
    const puebloSlug = pathname.match(/^\/pueblos\/([^/]+)\/categoria$/)?.[1];
    return permanentRedirect(req, `/pueblos/${puebloSlug}`);
  }

  // URLs reportadas por Search Console como 404/Gone: enviar a home.
  if (
    SEARCH_CONSOLE_404_PATHS.has(pathname) ||
    SEARCH_CONSOLE_404_WITH_QUERY.has(pathWithQuery)
  ) {
    return permanentRedirect(req, '/');
  }

  // Casos legacy con querystring (WP antiguo) — con fallback si el ID no está mapeado.
  if (pathname === '/semaforo' && idLugar) {
    const target = LEGACY_SEMAFORO_ID_REDIRECTS[idLugar];
    return permanentRedirect(req, target ?? '/pueblos');
  }
  if (pathname === '/experiencias-public' && idLugar) {
    const target = LEGACY_EXPERIENCIAS_ID_REDIRECTS[idLugar];
    return permanentRedirect(req, target ?? '/experiencias');
  }
  if (pathname === '/noticias-y-eventos' && idPublicacion) {
    const target = LEGACY_NOTICIA_ID_REDIRECTS[idPublicacion];
    return permanentRedirect(req, target ?? '/actualidad');
  }

  // Actualidad (global y por pueblo): ?tipo= / ?modo= siempre en minúsculas (SEO).
  const isActualidadSection =
    pathname === '/actualidad' || /^\/pueblos\/[^/]+\/actualidad$/.test(pathname);
  if (isActualidadSection) {
    const tipoP = req.nextUrl.searchParams.get('tipo');
    const modoP = req.nextUrl.searchParams.get('modo');
    let needsLowercase = false;
    const urlLower = req.nextUrl.clone();
    if (tipoP && tipoP !== tipoP.toLowerCase()) {
      urlLower.searchParams.set('tipo', tipoP.toLowerCase());
      needsLowercase = true;
    }
    if (modoP && modoP !== modoP.toLowerCase()) {
      urlLower.searchParams.set('modo', modoP.toLowerCase());
      needsLowercase = true;
    }
    if (needsLowercase) return NextResponse.redirect(urlLower, 301);
  }

  // Redirecciones legacy con equivalente actual (antes del strip de params para evitar 2-hop).
  const redirectTarget = LEGACY_DIRECT_REDIRECTS[pathname];
  if (redirectTarget) return permanentRedirect(req, redirectTarget);

  // URLs antiguas sin reemplazo: redirigir a home para evitar 404/410 en el rastreo.
  if (EXACT_GONE_PATHS.has(pathname)) return permanentRedirect(req, '/');

  // Canonicalizar mayúsculas → minúsculas en el path (evita duplicados).
  const rawPath = req.nextUrl.pathname;
  const lowerPath = rawPath.toLowerCase();
  if (rawPath !== lowerPath && rawPath !== '/') {
    const url = req.nextUrl.clone();
    url.pathname = lowerPath;
    return NextResponse.redirect(url, 301);
  }

  // Eliminar query params de tracking/legacy para consolidar canónicas.
  const strippedParamsRedirect = stripNonCanonicalParams(req);
  if (strippedParamsRedirect) return strippedParamsRedirect;

  // === CATCH-ALL LEGACY: single-segment paths not matching any known Next.js route → home ===
  const KNOWN_TOP_ROUTES = new Set([
    'actualidad', 'agenda', 'alertas', 'app', 'articulos', 'aviso-legal',
    'c', 'checkout', 'club', 'colaborador', 'contacto', 'cookies', 'cuenta',
    'cultura', 'cupones', 'donde-comer', 'donde-comprar', 'donde-dormir',
    'el-sello', 'en-familia', 'entrar', 'eventos', 'experiencias',
    'gestion', 'mapa', 'meteo', 'mi-cuenta', 'multiexperiencias',
    'naturaleza', 'newsletter', 'noche-romantica', 'noticias', 'notificaciones',
    'para-negocios', 'patrimonio', 'petfriendly', 'planifica', 'prensa',
    'privacidad', 'pueblos', 'que-comer', 'recuperar', 'recursos',
    'redes-sociales', 'registro', 'rutas', 'tienda', 'validador', 'webcams',
  ]);
  const singleSegMatch = pathname.match(/^\/([^/]+)$/);
  if (singleSegMatch) {
    const seg = singleSegMatch[1];
    if (!KNOWN_TOP_ROUTES.has(seg)) {
      return permanentRedirect(req, '/');
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-current-path', canonicalPath);
  requestHeaders.set('x-current-locale', activeLocale);
  if (queryLang && SUPPORTED_LOCALES.has(queryLang)) {
    const currentCookie = requestHeaders.get('cookie');
    requestHeaders.set('cookie', injectLocaleCookie(currentCookie, queryLang));
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set('Content-Language', activeLocale);
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
};
