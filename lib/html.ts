const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  nbsp: '\u00A0',
  Agrave: 'À', agrave: 'à', Aacute: 'Á', aacute: 'á', Acirc: 'Â', acirc: 'â',
  Atilde: 'Ã', atilde: 'ã', Auml: 'Ä', auml: 'ä', Aring: 'Å', aring: 'å',
  AElig: 'Æ', aelig: 'æ', Ccedil: 'Ç', ccedil: 'ç',
  Egrave: 'È', egrave: 'è', Eacute: 'É', eacute: 'é', Ecirc: 'Ê', ecirc: 'ê', Euml: 'Ë', euml: 'ë',
  Igrave: 'Ì', igrave: 'ì', Iacute: 'Í', iacute: 'í', Icirc: 'Î', icirc: 'î', Iuml: 'Ï', iuml: 'ï',
  ETH: 'Ð', eth: 'ð', Ntilde: 'Ñ', ntilde: 'ñ',
  Ograve: 'Ò', ograve: 'ò', Oacute: 'Ó', oacute: 'ó', Ocirc: 'Ô', ocirc: 'ô',
  Otilde: 'Õ', otilde: 'õ', Ouml: 'Ö', ouml: 'ö',
  Ugrave: 'Ù', ugrave: 'ù', Uacute: 'Ú', uacute: 'ú', Ucirc: 'Û', ucirc: 'û', Uuml: 'Ü', uuml: 'ü',
  Yacute: 'Ý', yacute: 'ý', THORN: 'Þ', thorn: 'þ', szlig: 'ß', yuml: 'ÿ',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201C', rdquo: '\u201D',
  ndash: '\u2013', mdash: '\u2014', hellip: '\u2026',
  times: '×', divide: '÷', euro: '€', copy: '©', reg: '®', trade: '™',
  iexcl: '¡', iquest: '¿',
};

export function decodeHtmlEntities(str: string): string {
  if (!str) return str;
  return str.replace(/&([^;]{1,10});/g, (match, entity: string) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const code = parseInt(entity.slice(2), 16);
      return isNaN(code) ? match : String.fromCharCode(code);
    }
    if (entity.startsWith('#')) {
      const code = parseInt(entity.slice(1), 10);
      return isNaN(code) ? match : String.fromCharCode(code);
    }
    return NAMED_ENTITIES[entity] ?? match;
  });
}

/** Elimina etiquetas HTML y decodifica entidades, devolviendo texto plano limpio. */
export function stripHtml(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') return '';
  return decodeHtmlEntities(
    html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, ' ')
      .replace(/<\/li>/gi, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim(),
  );
}
