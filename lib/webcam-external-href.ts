/**
 * Resuelve la URL que debe abrir el botón/enlace «Ver webcam» en nueva pestaña.
 *
 * Problema habitual: en admin se guarda `/webcams` o `https://…lospueblosmasbonitosdeespana.org/webcams`
 * pensando en el listado interno; el navegador interpreta rutas relativas respecto al origen actual
 * y el clic acaba en la página de webcams del propio sitio en lugar del proveedor externo.
 */
const LPBE_HOST = 'lospueblosmasbonitosdeespana.org';

/** Página pública de las cámaras en el ayuntamiento de Comillas (cuando la URL guardada es errónea). */
export const COMILLAS_WEBCAM_PUBLIC_PAGE =
  'https://www.comillas.es/comillas/web_php/index.php?contenido=subapartados_coconut&id_boto=82&title=webcams-comillas';

function isOurSiteWebcamsListing(url: URL): boolean {
  const host = url.hostname.replace(/^www\./, '');
  if (host !== LPBE_HOST) return false;
  return url.pathname === '/webcams' || url.pathname.startsWith('/webcams/');
}

export function resolveWebcamExternalHref(
  rawUrl: string,
  puebloSlug?: string | null,
): string {
  const s = (rawUrl || '').trim();

  if (!s) {
    return puebloSlug === 'comillas' ? COMILLAS_WEBCAM_PUBLIC_PAGE : '#';
  }

  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      if (isOurSiteWebcamsListing(u) && puebloSlug === 'comillas') {
        return COMILLAS_WEBCAM_PUBLIC_PAGE;
      }
    } catch {
      return s;
    }
    return s;
  }

  if (s.startsWith('//')) {
    return `https:${s}`;
  }

  // Ruta relativa: el navegador la resolvería en el mismo sitio (error frecuente).
  if (s.startsWith('/')) {
    if (s.startsWith('/comillas/')) {
      return `https://www.comillas.es${s}`;
    }
    if (s === '/webcams' || s.startsWith('/webcams?')) {
      return puebloSlug === 'comillas' ? COMILLAS_WEBCAM_PUBLIC_PAGE : s;
    }
    return s;
  }

  // Dominio sin esquema (p. ej. www.comillas.es/…)
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}/i.test(s)) {
    return `https://${s}`;
  }

  return s;
}
