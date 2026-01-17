/**
 * Sanitiza HTML para permitir solo tags seguros y sin atributos data-*
 * Permite: p, strong, em, ul, ol, li, br, a, h2, h3
 */

const ALLOWED_TAGS = ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'a', 'h2', 'h3'];
const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href', 'title', 'target', 'rel'],
};

export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Crear un documento temporal (solo en navegador)
  if (typeof window === 'undefined') {
    // En el servidor, hacer limpieza básica con regex
    return cleanHtmlServer(html);
  }
  
  // En el navegador, usar DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  cleanNode(doc.body);
  
  return doc.body.innerHTML;
}

function cleanNode(node: Node): void {
  const nodesToRemove: Node[] = [];
  
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as Element;
      const tagName = element.tagName.toLowerCase();
      
      // Si el tag no está permitido, eliminar el nodo pero mantener su contenido
      if (!ALLOWED_TAGS.includes(tagName)) {
        nodesToRemove.push(child);
        continue;
      }
      
      // Limpiar atributos
      const allowedAttrs = ALLOWED_ATTRS[tagName] || [];
      const attrsToRemove: string[] = [];
      
      for (let j = 0; j < element.attributes.length; j++) {
        const attr = element.attributes[j];
        // Eliminar atributos data-* y atributos no permitidos
        if (attr.name.startsWith('data-') || !allowedAttrs.includes(attr.name)) {
          attrsToRemove.push(attr.name);
        }
      }
      
      attrsToRemove.forEach(attr => element.removeAttribute(attr));
      
      // Recursivamente limpiar hijos
      cleanNode(child);
    }
  }
  
  // Eliminar nodos no permitidos pero mantener su contenido
  nodesToRemove.forEach(child => {
    const parent = child.parentNode;
    if (parent) {
      // Mover todos los hijos del nodo a eliminar antes de eliminarlo
      while (child.firstChild) {
        parent.insertBefore(child.firstChild, child);
      }
      parent.removeChild(child);
    }
  });
}

/**
 * Versión servidor: limpieza básica con regex
 */
function cleanHtmlServer(html: string): string {
  let cleaned = html;
  
  // Eliminar atributos data-*
  cleaned = cleaned.replace(/\s+data-[a-z-]+="[^"]*"/gi, '');
  cleaned = cleaned.replace(/\s+data-[a-z-]+='[^']*'/gi, '');
  
  // Eliminar tags no permitidos (conservar contenido)
  const tagsToRemove = ['h1', 'h4', 'h5', 'h6', 'div', 'span', 'section', 'article', 'header', 'footer', 'nav', 'aside'];
  
  tagsToRemove.forEach(tag => {
    // Eliminar tag de apertura
    cleaned = cleaned.replace(new RegExp(`<${tag}[^>]*>`, 'gi'), '');
    // Eliminar tag de cierre
    cleaned = cleaned.replace(new RegExp(`</${tag}>`, 'gi'), '');
  });
  
  // Eliminar scripts y styles completamente
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  return cleaned;
}

/**
 * Extrae texto plano de HTML (para excerpts)
 */
export function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Crea un excerpt limpio de HTML
 */
export function createExcerpt(html: string, maxLength: number = 160): string {
  const text = stripHtml(html);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trimEnd() + '...';
}
