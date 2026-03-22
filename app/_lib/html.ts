/**
 * Quita etiquetas HTML y decodifica entidades para mostrar texto plano en tarjetas y listas.
 * Usar siempre que se muestre resumen, contenido o descripción que pueda venir con HTML.
 */
export function stripHtml(html: string): string {
  if (typeof html !== 'string') return '';
  return html
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/<[^>]*>/g, '')
    .replace(/<[^>]*$/g, '')
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
