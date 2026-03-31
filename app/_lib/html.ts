import { decode as heDecode } from 'he';

/**
 * Quita etiquetas HTML y decodifica entidades para mostrar texto plano en tarjetas y listas.
 * Usar siempre que se muestre resumen, contenido o descripción que pueda venir con HTML.
 */
export function stripHtml(html: string): string {
  if (typeof html !== 'string') return '';
  const withoutTags = html
    .replace(/<[^>]*>/g, '')
    .replace(/<[^>]*$/g, '')
    .trim();
  return heDecode(withoutTags)
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const URL_RE = /(https?:\/\/[^\s<>"')\]]+)/gi;

function truncateUrl(url: string, max = 60): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    let decoded: string;
    try {
      decoded = decodeURIComponent(u.pathname + u.search).replace(/\/$/, '');
    } catch {
      decoded = (u.pathname + u.search).replace(/\/$/, '');
    }
    if (!decoded || decoded === '/') return host;
    const full = `${host}${decoded}`;
    if (full.length <= max) return full;
    return host;
  } catch {
    if (url.length <= max) return url;
    return `${url.slice(0, max - 1)}…`;
  }
}

/**
 * Convierte URLs en bruto en enlaces markdown para que ReactMarkdown las muestre
 * como links clickables con texto truncado.
 */
export function autoLinkUrls(text: string): string {
  if (typeof text !== 'string') return '';
  return text.replace(URL_RE, (url) => {
    const display = truncateUrl(url);
    return `[${display}](${url})`;
  });
}

/**
 * Adds alt attribute to <img> tags that are missing it or have an empty alt.
 * Uses `fallback` as the default alt text.
 */
export function injectImgAlt(html: string, fallback: string): string {
  if (!html || !fallback) return html;
  return html.replace(/<img\b([^>]*?)>/gi, (match, attrs: string) => {
    if (/\balt\s*=/i.test(attrs)) {
      if (/alt\s*=\s*""\s*/i.test(attrs) || /alt\s*=\s*''\s*/i.test(attrs)) {
        return match
          .replace(/alt\s*=\s*""/i, `alt="${fallback}"`)
          .replace(/alt\s*=\s*''/i, `alt='${fallback}'`);
      }
      return match;
    }
    return `<img alt="${fallback}" ${attrs.trim()}>`;
  });
}
