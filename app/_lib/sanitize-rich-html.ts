import DOMPurify from 'isomorphic-dompurify';

/**
 * Limpieza QUIRÚRGICA de HTML para evitar que pegados desde Word, Notion,
 * Google Docs o webs en modo oscuro estropeen el aspecto del sitio.
 *
 * Filosofía: **respetar el HTML escrito a mano** (colecciones, hero
 * personalizadas con `<div style="background:linear-gradient(...)">`, etc.)
 * y eliminar SOLO los estilos cuya huella delata un copy-paste accidental.
 *
 * Heurística de "huella de pegado": un atributo `style` se considera basura
 * (y se elimina entero, junto con `bgcolor`/`color` de esa etiqueta) si
 * contiene alguna de estas propiedades CSS, que casi nadie escribe a mano:
 *   - `-webkit-text-stroke-width`
 *   - `text-decoration-thickness` / `-style` / `-color`
 *   - `font-variant-ligatures` / `font-variant-caps`
 *   - `orphans` / `widows`
 *   - `text-indent` / `word-spacing` / `letter-spacing`
 *   - `font-family: 'Roboto'|'Manrope'|'Times'|'Calibri'|'Arial'|'Helvetica'…`
 *     (cuando aparece junto a otras propiedades; no la usamos como única señal)
 *
 * También elimina sin condiciones:
 *   - `<script>`, `<style>`, `<meta>`, `<link>`, comentarios HTML.
 *   - Etiquetas Word/Office: `<o:p>`, `<xml>`, `<w:*>`.
 *   - `<font>` (etiqueta legacy obsoleta).
 *
 * El resto del HTML (incluido `style="background:linear-gradient(...);
 * padding:2rem; border-radius:12px"`) se conserva intacto.
 */
export function sanitizeRichHtml(html: string | null | undefined): string {
  if (!html) return '';

  // 1) DOMPurify: elimina <script>, <style>, on*-handlers, javascript: URIs, etc.
  //    NO eliminamos el atributo `style` porque queremos respetar maquetación legítima.
  let cleaned = DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target'],
    FORBID_TAGS: ['style', 'script', 'meta', 'link', 'font', 'o:p', 'xml'],
    ALLOW_DATA_ATTR: true,
  }) as string;

  // 2) Elimina comentarios HTML (Word los mete a montones).
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // 3) Tira `style="..."` SOLO en etiquetas cuya huella delata copy-paste.
  cleaned = stripPastedStyleAttributes(cleaned);

  return cleaned;
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

    // Extrae el contenido de style="..."
    const styleMatch = attrs.match(/\sstyle\s*=\s*"([^"]*)"/i) ?? attrs.match(/\sstyle\s*=\s*'([^']*)'/i);
    if (!styleMatch) return match;

    const styleValue = styleMatch[1].toLowerCase();
    const looksPasted = PASTE_FINGERPRINTS.some((fp) => styleValue.includes(fp));
    if (!looksPasted) return match;

    // Quita style, bgcolor y color de esta etiqueta concreta.
    let newAttrs = attrs
      .replace(/\sstyle\s*=\s*"[^"]*"/i, '')
      .replace(/\sstyle\s*=\s*'[^']*'/i, '')
      .replace(/\sbgcolor\s*=\s*"[^"]*"/i, '')
      .replace(/\sbgcolor\s*=\s*'[^']*'/i, '')
      .replace(/\scolor\s*=\s*"[^"]*"/i, '')
      .replace(/\scolor\s*=\s*'[^']*'/i, '');
    return `<${tag}${newAttrs}>`;
  });
}
