/**
 * Quita etiquetas HTML y decodifica entidades para mostrar texto plano en tarjetas y listas.
 * Usar siempre que se muestre resumen, contenido o descripción que pueda venir con HTML.
 */
export function stripHtml(html: string): string {
  if (typeof html !== 'string') return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
