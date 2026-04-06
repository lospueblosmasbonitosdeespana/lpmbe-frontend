import { type NextRequest, NextResponse } from 'next/server';

/**
 * Dominios de streaming HLS conocidos que pueden tener problemas de CORS.
 * Añadir aquí nuevos proveedores según se vayan incorporando webcams.
 */
const ALLOWED_STREAMING_HOSTS: string[] = [
  'streaming.comunitatvalenciana.com',
  'cams.projecte4estacions.com',
  'camserver2.in2thebeach.es',
  'camserver.in2thebeach.es',
];
  // Añadir más hosts según sea necesario, p.ej.:
  // 'webcam.turismoextremadura.com',
  // 'live.visitcatalunya.cat',
];

function isAllowedUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_STREAMING_HOSTS.some(
      (h) => hostname === h || hostname.endsWith(`.${h}`),
    );
  } catch {
    return false;
  }
}

/**
 * Reescribe las URLs dentro de un manifest .m3u8 para que pasen también
 * por este proxy. Convierte rutas relativas en absolutas usando el origen
 * del manifest como base.
 */
function rewriteManifest(text: string, originalUrl: string, proxyBase: string): string {
  const base = new URL(originalUrl);

  return text
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();

      // Líneas vacías o comentarios que NO son URIs → se dejan igual.
      if (!trimmed || trimmed.startsWith('#')) return line;

      // Es una URI (relativa o absoluta).
      const absolute = trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : new URL(trimmed, base).toString();

      return `${proxyBase}?url=${encodeURIComponent(absolute)}`;
    })
    .join('\n');
}

export async function GET(request: NextRequest) {
  const { searchParams, origin, pathname } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Parámetro url requerido' }, { status: 400 });
  }

  if (!isAllowedUrl(targetUrl)) {
    return NextResponse.json(
      { error: 'Dominio de streaming no permitido' },
      { status: 403 },
    );
  }

  try {
    let hostname = '';
    try {
      hostname = new URL(targetUrl).hostname;
    } catch {
      /* ignore */
    }

    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    // Algunos CDNs de streaming exigen referer/origen de un sitio autorizado.
    if (hostname === 'cams.projecte4estacions.com') {
      headers.Referer = 'https://www.vallboi.cat/';
      headers.Origin = 'https://www.vallboi.cat';
    }

    const upstream = await fetch(targetUrl, {
      headers,
      // No cachear en el servidor — el HLS ya maneja su propio tiempo de refresco.
      cache: 'no-store',
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Error upstream: ${upstream.status}` },
        { status: 502 },
      );
    }

    const contentType = upstream.headers.get('content-type') ?? '';
    const isManifest =
      contentType.includes('mpegurl') ||
      targetUrl.split('?')[0].toLowerCase().endsWith('.m3u8');

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    };

    if (isManifest) {
      const text = await upstream.text();
      const proxyBase = `${origin}${pathname}`;
      const rewritten = rewriteManifest(text, targetUrl, proxyBase);

      return new NextResponse(rewritten, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-store',
          ...corsHeaders,
        },
      });
    }

    // Segmento de vídeo (.ts u otro binario) → pasar a través directamente.
    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType || 'video/MP2T',
        'Cache-Control': 'public, max-age=30',
        ...corsHeaders,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo conectar con el servidor de streaming' },
      { status: 502 },
    );
  }
}

// Responder correctamente a preflight OPTIONS.
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
