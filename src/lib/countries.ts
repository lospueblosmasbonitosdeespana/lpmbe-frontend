/**
 * Países para envíos. Uso de códigos ISO 3166-1 alpha-2 para consistencia
 * y soporte multiidioma (nombres en español como idioma por defecto).
 */
export const PAISES_ENVIO = [
  { value: 'ES', label: 'España' },
  { value: 'PT', label: 'Portugal' },
  { value: 'AD', label: 'Andorra' },
  { value: 'DE', label: 'Alemania' },
  { value: 'AT', label: 'Austria' },
  { value: 'BE', label: 'Bélgica' },
  { value: 'BG', label: 'Bulgaria' },
  { value: 'HR', label: 'Croacia' },
  { value: 'CY', label: 'Chipre' },
  { value: 'DK', label: 'Dinamarca' },
  { value: 'SK', label: 'Eslovaquia' },
  { value: 'SI', label: 'Eslovenia' },
  { value: 'EE', label: 'Estonia' },
  { value: 'FI', label: 'Finlandia' },
  { value: 'FR', label: 'Francia' },
  { value: 'GR', label: 'Grecia' },
  { value: 'HU', label: 'Hungría' },
  { value: 'IE', label: 'Irlanda' },
  { value: 'IS', label: 'Islandia' },
  { value: 'IT', label: 'Italia' },
  { value: 'LV', label: 'Letonia' },
  { value: 'LI', label: 'Liechtenstein' },
  { value: 'LT', label: 'Lituania' },
  { value: 'LU', label: 'Luxemburgo' },
  { value: 'MT', label: 'Malta' },
  { value: 'MC', label: 'Mónaco' },
  { value: 'NO', label: 'Noruega' },
  { value: 'NL', label: 'Países Bajos' },
  { value: 'PL', label: 'Polonia' },
  { value: 'GB', label: 'Reino Unido' },
  { value: 'CZ', label: 'República Checa' },
  { value: 'RO', label: 'Rumanía' },
  { value: 'SM', label: 'San Marino' },
  { value: 'SE', label: 'Suecia' },
  { value: 'CH', label: 'Suiza' },
  // Resto del mundo
  { value: 'US', label: 'Estados Unidos' },
  { value: 'MX', label: 'México' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CL', label: 'Chile' },
  { value: 'CO', label: 'Colombia' },
  { value: 'PE', label: 'Perú' },
  { value: 'BR', label: 'Brasil' },
  { value: 'CA', label: 'Canadá' },
  { value: 'AU', label: 'Australia' },
  { value: 'JP', label: 'Japón' },
  { value: 'CN', label: 'China' },
  { value: 'XX', label: 'Otro (especificar abajo)' },
] as const;

/** Mapa ISO → nombre en español (para visualización) */
const ISO_TO_LABEL = new Map<string, string>(PAISES_ENVIO.map((p) => [p.value, p.label]));

/** Alias de nombres legacy/typos → ISO (para mostrar correctamente direcciones antiguas) */
const NAME_TO_ISO: Record<string, string> = {
  españa: 'ES', espana: 'ES', spain: 'ES',
  portugal: 'PT',
  andorra: 'AD',
  alemania: 'DE', germany: 'DE',
  austria: 'AT',
  belgica: 'BE', bélgica: 'BE', begica: 'BE', bégica: 'BE', belgium: 'BE', belgique: 'BE',
  bulgaria: 'BG',
  croacia: 'HR', croatia: 'HR',
  chipre: 'CY', cyprus: 'CY',
  dinamarca: 'DK', denmark: 'DK',
  eslovaquia: 'SK', slovakia: 'SK', eslovakia: 'SK',
  eslovenia: 'SI', slovenia: 'SI',
  estonia: 'EE',
  finlandia: 'FI', finland: 'FI',
  francia: 'FR', france: 'FR',
  grecia: 'GR', greece: 'GR',
  hungria: 'HU', hungary: 'HU',
  irlanda: 'IE', ireland: 'IE',
  islandia: 'IS', iceland: 'IS',
  italia: 'IT', italy: 'IT',
  letonia: 'LV', latvia: 'LV',
  liechtenstein: 'LI',
  lituania: 'LT', lithuania: 'LT',
  luxemburgo: 'LU', luxembourg: 'LU',
  malta: 'MT',
  monaco: 'MC', mónaco: 'MC',
  noruega: 'NO', norway: 'NO',
  'países bajos': 'NL', 'paises bajos': 'NL', holanda: 'NL', netherlands: 'NL',
  polonia: 'PL', poland: 'PL',
  'reino unido': 'GB', uk: 'GB', 'united kingdom': 'GB',
  'republica checa': 'CZ', 'república checa': 'CZ', 'czech republic': 'CZ',
  rumania: 'RO', rumanía: 'RO', romania: 'RO',
  'san marino': 'SM',
  suecia: 'SE', sweden: 'SE',
  suiza: 'CH', switzerland: 'CH',
  'estados unidos': 'US', usa: 'US', 'united states': 'US',
  mexico: 'MX', méxico: 'MX',
  argentina: 'AR',
  chile: 'CL',
  colombia: 'CO',
  peru: 'PE', perú: 'PE',
  brasil: 'BR', brazil: 'BR',
  canada: 'CA', canadá: 'CA',
  australia: 'AU',
  japon: 'JP', japón: 'JP', japan: 'JP',
  china: 'CN',
};

/**
 * Obtiene el nombre legible de un país a partir de ISO o nombre legacy.
 * Útil para mostrar direcciones guardadas con distintos formatos.
 */
export function getCountryLabel(pais: string | null | undefined): string {
  if (!pais?.trim()) return '—';
  const p = pais.trim();
  if (p.length === 2) {
    return ISO_TO_LABEL.get(p.toUpperCase()) ?? p;
  }
  const iso = NAME_TO_ISO[p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')]
    ?? NAME_TO_ISO[p.toLowerCase()];
  return iso ? (ISO_TO_LABEL.get(iso) ?? pais) : pais;
}

/**
 * Normaliza país a ISO para envío al backend (acepta legacy).
 */
export function toCountryIso(pais: string | null | undefined): string {
  if (!pais?.trim()) return 'ES';
  const p = pais.trim();
  if (p.length === 2 && p.toUpperCase() !== 'XX') return p.toUpperCase();
  const n = p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const iso = NAME_TO_ISO[n] ?? NAME_TO_ISO[p.toLowerCase()];
  return iso ?? p;
}

/** Valor del select para un país (ISO o 'XX' si es otro). */
export function getCountrySelectValue(pais: string | null | undefined): string {
  if (!pais?.trim()) return 'ES';
  const iso = toCountryIso(pais);
  if (iso === pais && iso.length === 2 && PAISES_ENVIO.some((p) => p.value === iso)) return iso;
  return PAISES_ENVIO.some((p) => p.value === iso) ? iso : 'XX';
}
