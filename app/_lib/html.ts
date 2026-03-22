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
  if (url.length <= max) return url;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const path = u.pathname.replace(/\/$/, '');
    const short = `${host}${path}`;
    if (short.length <= max) return short;
    return `${short.slice(0, max - 1)}…`;
  } catch {
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
