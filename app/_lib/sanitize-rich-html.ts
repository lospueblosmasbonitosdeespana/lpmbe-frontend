/**
 * Limpieza QUIRÚRGICA de HTML para evitar que pegados desde Word, Notion,
 * Google Docs o webs en modo oscuro estropeen el aspecto del sitio.
 *
 * IMPORTANTE: Esta función se ejecuta en SSR (Server Components y SSR de
 * componentes "use client"). NO podemos usar `isomorphic-dompurify` porque
 * carga `jsdom` en server y rompe en runtimes serverless (Vercel Fluid)
 * — provocó error rate del 47–100 % en /eventos/[slug], /noticias/[slug],
 * /cultura|naturaleza|patrimonio|en-familia|que-comer/[puebloSlug]/[pageSlug],
 * etc.
 *
 * Usamos solo regex en server. Como el contenido lo escriben usuarios
 * autenticados (alcaldes/colaboradores) y el backend ya valida, este nivel
 * de limpieza basta — es el mismo enfoque del helper del backend
 * (`backend/src/common/sanitize-rich-html.ts`). Aun así añadimos una capa
 * de defensa en profundidad: quitamos `on*=` handlers inline y URIs
 * `javascript:` por si algún copy-paste los trajera.
 *
 * Filosofía: **respetar el HTML escrito a mano** (colecciones, hero
 * personalizadas con `<div style="background:linear-gradient(...)">`, etc.)
 * y eliminar SOLO los `style` cuya huella delata copy-paste accidental.
 */
export function sanitizeRichHtml(html: string | null | undefined): string {
  if (!html) return '';

  let out = html;

  // 1) Comentarios HTML (Word los mete a montones).
  out = out.replace(/<!--[\s\S]*?-->/g, '');

  // 2) Etiquetas peligrosas o inútiles (con su contenido).
  out = out.replace(/<script\b[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<style\b[\s\S]*?<\/style>/gi, '');
  out = out.replace(/<\/?(?:meta|link|xml|o:p|w:[a-z-]+)\b[^>]*>/gi, '');

  // 3) <font ...>...</font>: eliminar tags conservando el texto interior.
  out = out.replace(/<\/?font\b[^>]*>/gi, '');

  // 4) Defensa en profundidad: quitar handlers `on*=` y URIs javascript:
  out = stripInlineEventHandlers(out);
  out = stripJavascriptUris(out);

  // 5) Estilos pegados (heurística de huella).
  out = stripPastedStyleAttributes(out);

  return out;
}

const PASTE_FINGERPRINTS = [
  '-webkit-text-stroke-width',
  'text-decoration-thickness',
  'text-decoration-style',
  'text-decoration-color',
  'font-variant-ligatures',
  'font-variant-caps',
  'letter-spacing',
  'word-spacing',
  'text-indent',
  'orphans',
  'widows',
];

/**
 * Para cada atributo style="..." del HTML, decide si es basura de copy-paste
 * (contiene alguna huella) y, en ese caso, lo elimina junto con `bgcolor` y
 * `color` heredados de esa misma etiqueta. Nunca toca atributos `style`
 * "limpios" (los que un humano ha escrito a mano).
 */
function stripPastedStyleAttributes(html: string): string {
  return html.replace(/<([a-z][a-z0-9]*)\b([^>]*)>/gi, (match, tag: string, attrs: string) => {
    if (!attrs.includes('style')) return match;

    const styleMatch =
      attrs.match(/\sstyle\s*=\s*"([^"]*)"/i) ??
      attrs.match(/\sstyle\s*=\s*'([^']*)'/i);
    if (!styleMatch) return match;

    const styleValue = styleMatch[1].toLowerCase();
    const looksPasted = PASTE_FINGERPRINTS.some((fp) => styleValue.includes(fp));
    if (!looksPasted) return match;

    const newAttrs = attrs
      .replace(/\sstyle\s*=\s*"[^"]*"/i, '')
      .replace(/\sstyle\s*=\s*'[^']*'/i, '')
      .replace(/\sbgcolor\s*=\s*"[^"]*"/i, '')
      .replace(/\sbgcolor\s*=\s*'[^']*'/i, '')
      .replace(/\scolor\s*=\s*"[^"]*"/i, '')
      .replace(/\scolor\s*=\s*'[^']*'/i, '');
    return `<${tag}${newAttrs}>`;
  });
}

/** Quita atributos `onclick=…`, `onerror=…`, etc. de cualquier etiqueta. */
function stripInlineEventHandlers(html: string): string {
  return html.replace(
    /<([a-z][a-z0-9]*)\b([^>]*)>/gi,
    (match, tag: string, attrs: string) => {
      if (!/\son[a-z]+\s*=/i.test(attrs)) return match;
      const cleaned = attrs
        .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
        .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
        .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '');
      return `<${tag}${cleaned}>`;
    },
  );
}

/** Neutraliza href/src con `javascript:`. */
function stripJavascriptUris(html: string): string {
  return html.replace(
    /\s(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi,
    ' $1="#"',
  );
}
