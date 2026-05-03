/**
 * Helpers para los activos editables desde
 *   /gestion/asociacion/mi-cuenta-usuarios
 *
 * Los datos viven en SiteSetting.miCuentaAssets (JSON) y se exponen vía
 *   GET /public/site-settings  →  miCuentaAssets
 *
 * Estructura esperada:
 *   {
 *     "clubLogo":         "https://r2.../club-logo.png",
 *     "clubLogoCard":     "https://r2.../club-logo-card.png",
 *     "nivelAvatares": {
 *        "turistaCurioso":   "https://r2.../...png",
 *        "exploradorLocal":  "https://r2.../...png",
 *        ... 9 niveles
 *     }
 *   }
 */

export type MiCuentaAssets = {
  clubLogo?: string | null;
  clubLogoCard?: string | null;
  nivelAvatares?: Record<string, string | null> | null;
};

export const NIVEL_SLUG: Record<string, string> = {
  'Turista Curioso': 'turistaCurioso',
  'Explorador Local': 'exploradorLocal',
  'Viajero Apasionado': 'viajeroApasionado',
  'Amante de los Pueblos': 'amantePueblos',
  'Gran Viajero': 'granViajero',
  'Leyenda LPBE': 'leyendaLpbe',
  'Embajador de los Pueblos': 'embajadorPueblos',
  'Maestro Viajero': 'maestroViajero',
  'Gran Maestre de los Pueblos': 'granMaestre',
};

/**
 * Slots conocidos. La página de admin se genera a partir de aquí, así que
 * añadir nuevos slots solo requiere extender este listado.
 */
export const NIVEL_SLOTS: Array<{ slug: string; label: string }> = [
  { slug: 'turistaCurioso',    label: 'Turista Curioso (1)' },
  { slug: 'exploradorLocal',   label: 'Explorador Local (2)' },
  { slug: 'viajeroApasionado', label: 'Viajero Apasionado (3)' },
  { slug: 'amantePueblos',     label: 'Amante de los Pueblos (4)' },
  { slug: 'granViajero',       label: 'Gran Viajero (5)' },
  { slug: 'leyendaLpbe',       label: 'Leyenda LPBE (6)' },
  { slug: 'embajadorPueblos',  label: 'Embajador de los Pueblos (7)' },
  { slug: 'maestroViajero',    label: 'Maestro Viajero (8)' },
  { slug: 'granMaestre',       label: 'Gran Maestre de los Pueblos (9)' },
];

export function getNivelOverride(
  assets: MiCuentaAssets | null | undefined,
  nombreNivel: string,
): string | null {
  if (!assets?.nivelAvatares) return null;
  const slug = NIVEL_SLUG[nombreNivel];
  if (!slug) return null;
  const url = assets.nivelAvatares[slug];
  return typeof url === 'string' && url.trim() ? url : null;
}

export function getClubLogoOverride(
  assets: MiCuentaAssets | null | undefined,
  variant: 'header' | 'card' = 'header',
): string | null {
  if (!assets) return null;
  const url = variant === 'card' ? assets.clubLogoCard : assets.clubLogo;
  return typeof url === 'string' && url.trim() ? url : null;
}
