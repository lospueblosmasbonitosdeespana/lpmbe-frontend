export type FilterType = 'tag' | 'servicio';
export type LocationType = 'region' | 'comunidad';

export interface FilterMapping {
  type: FilterType;
  key: string;
  label_es: string;
}

export interface LocationMapping {
  type: LocationType;
  key: string;
  label_es: string;
}

export const FILTER_SLUG_MAP: Record<string, FilterMapping> = {
  'castillo': { type: 'tag', key: 'CASTILLO', label_es: 'Castillo' },
  'alcazaba': { type: 'tag', key: 'ALCAZABA', label_es: 'Alcazaba' },
  'murallas': { type: 'tag', key: 'MURALLAS', label_es: 'Murallas' },
  'torre-del-homenaje': { type: 'tag', key: 'TORRE_HOMENAJE', label_es: 'Torre del homenaje' },
  'torre-defensiva': { type: 'tag', key: 'TORRE_DEFENSIVA', label_es: 'Torre defensiva' },

  'catedral': { type: 'tag', key: 'CATEDRAL', label_es: 'Catedral' },
  'colegiata': { type: 'tag', key: 'COLEGIATA', label_es: 'Colegiata' },
  'monasterio': { type: 'tag', key: 'MONASTERIO', label_es: 'Monasterio' },
  'convento': { type: 'tag', key: 'CONVENTO', label_es: 'Convento' },
  'iglesia': { type: 'tag', key: 'IGLESIA', label_es: 'Iglesia destacada' },
  'ermita': { type: 'tag', key: 'ERMITA', label_es: 'Ermita' },
  'cripta': { type: 'tag', key: 'CRIPTA', label_es: 'Cripta' },
  'mezquita': { type: 'tag', key: 'MEZQUITA', label_es: 'Mezquita' },
  'retablo': { type: 'tag', key: 'RETABLO', label_es: 'Retablo' },
  'organo-historico': { type: 'tag', key: 'ORGANO', label_es: 'Órgano histórico' },
  'talla-religiosa': { type: 'tag', key: 'TALLA_RELIGIOSA', label_es: 'Talla religiosa' },

  'palacio': { type: 'tag', key: 'PALACIO', label_es: 'Palacio' },
  'palacio-episcopal': { type: 'tag', key: 'PALACIO_EPISCOPAL', label_es: 'Palacio episcopal' },
  'plaza-mayor': { type: 'tag', key: 'PLAZA_MAYOR_DESTACADA', label_es: 'Plaza mayor' },
  'puente-historico': { type: 'tag', key: 'PUENTE_HISTORICO', label_es: 'Puente histórico' },
  'puerta-arco': { type: 'tag', key: 'PUERTA_ARCO', label_es: 'Puerta o arco' },
  'soportales': { type: 'tag', key: 'SOPORTALES', label_es: 'Soportales' },
  'claustro': { type: 'tag', key: 'CLAUSTRO', label_es: 'Claustro' },
  'pintura-mural': { type: 'tag', key: 'PINTURA_MURAL', label_es: 'Pintura mural' },
  'molino': { type: 'tag', key: 'MOLINO', label_es: 'Molino' },
  'lavadero': { type: 'tag', key: 'LAVADERO_ANTIGUO', label_es: 'Lavadero antiguo' },
  'fuente-patrimonial': { type: 'tag', key: 'FUENTE_PATRIMONIAL', label_es: 'Fuente patrimonial' },
  'plaza-de-toros': { type: 'tag', key: 'PLAZA_TOROS', label_es: 'Plaza de toros' },
  'acueducto': { type: 'tag', key: 'ACUEDUCTO', label_es: 'Acueducto' },
  'casas-colgadas': { type: 'tag', key: 'CASAS_COLGADAS', label_es: 'Casas colgadas' },
  'casa-famoso': { type: 'tag', key: 'CASA_FAMOSO', label_es: 'Casa de personaje ilustre' },
  'cementerio-historico': { type: 'tag', key: 'CEMENTERIO_HISTORICO', label_es: 'Cementerio histórico' },
  'corral-de-comedias': { type: 'tag', key: 'CORRAL_COMEDIAS', label_es: 'Corral de comedias' },
  'teatro-antiguo': { type: 'tag', key: 'TEATRO_ANTIGUO', label_es: 'Teatro antiguo' },
  'antigua-carcel': { type: 'tag', key: 'ANTIGUA_CARCEL', label_es: 'Antigua cárcel' },
  'nevero': { type: 'tag', key: 'NEVERO', label_es: 'Nevero' },
  'puerto-embarcadero': { type: 'tag', key: 'PUERTO_EMBARCADERO', label_es: 'Puerto o embarcadero' },
  'posada': { type: 'tag', key: 'POSADA', label_es: 'Posada histórica' },

  'cascada': { type: 'tag', key: 'CASCADA', label_es: 'Cascada' },
  'cueva-visitable': { type: 'tag', key: 'CUEVA_VISITABLE', label_es: 'Cueva visitable' },
  'mirador': { type: 'tag', key: 'MIRADOR_SINGULAR', label_es: 'Mirador singular' },
  'via-verde': { type: 'tag', key: 'VIA_VERDE', label_es: 'Vía verde' },
  'parque-natural': { type: 'tag', key: 'PARQUE_NATURAL', label_es: 'Parque natural' },
  'geoparque': { type: 'tag', key: 'GEOPARQUE', label_es: 'Geoparque UNESCO' },
  'rio': { type: 'tag', key: 'RIO', label_es: 'A orillas de un río' },
  'lago-embalse': { type: 'tag', key: 'LAGO_EMBALSE', label_es: 'Lago o embalse' },
  'desfiladero': { type: 'tag', key: 'DESFILADERO', label_es: 'Desfiladero' },
  'jardin-historico': { type: 'tag', key: 'JARDIN_HISTORICO', label_es: 'Jardín histórico' },
  'termas': { type: 'tag', key: 'TERMAS', label_es: 'Aguas termales' },
  'pozas-naturales': { type: 'tag', key: 'POZAS', label_es: 'Pozas naturales' },
  'pistas-esqui': { type: 'tag', key: 'PISTAS_ESQUI_CERCANAS', label_es: 'Pistas de esquí cercanas' },
  'monumento-natural': { type: 'tag', key: 'MONUMENTO_NATURAL', label_es: 'Monumento natural' },

  'yacimiento-arqueologico': { type: 'tag', key: 'YACIMIENTO_ARQUEOLOGICO', label_es: 'Yacimiento arqueológico' },
  'monumentos-romanos': { type: 'tag', key: 'MONUMENTOS_ROMANOS', label_es: 'Monumentos romanos' },
  'romanico': { type: 'tag', key: 'JOYA_ROMANICA', label_es: 'Joya del románico' },
  'gotico': { type: 'tag', key: 'JOYA_GOTICA', label_es: 'Joya del gótico' },
  'mudejar': { type: 'tag', key: 'JOYA_MUDEJAR', label_es: 'Joya del mudéjar' },
  'renacentista': { type: 'tag', key: 'JOYA_RENACENTISTA', label_es: 'Joya del renacimiento' },
  'barroco': { type: 'tag', key: 'JOYA_BARROCA', label_es: 'Joya del barroco' },
  'casco-historico-bic': { type: 'tag', key: 'CASCO_HISTORICO_BIC', label_es: 'Conjunto Histórico BIC' },
  'patrimonio-humanidad': { type: 'tag', key: 'PATRIMONIO_HUMANIDAD', label_es: 'Patrimonio de la Humanidad' },

  'pueblo-de-piedra': { type: 'tag', key: 'PUEBLO_PIEDRA', label_es: 'Pueblo de piedra' },
  'pueblo-blanco': { type: 'tag', key: 'PUEBLO_BLANCO', label_es: 'Pueblo blanco' },
  'starlight': { type: 'tag', key: 'STARLIGHT', label_es: 'Certificación Starlight' },
  'pueblo-de-cine': { type: 'tag', key: 'PUEBLO_CINE', label_es: 'Pueblo de cine' },
  'camino-de-santiago': { type: 'tag', key: 'CAMINO_SANTIAGO', label_es: 'Camino de Santiago' },
  'juderia': { type: 'tag', key: 'JUDERIA', label_es: 'Barrio judío' },
  'balcones-floridos': { type: 'tag', key: 'BALCONES_FLORIDOS', label_es: 'Balcones floridos' },
  'casas-entramadas': { type: 'tag', key: 'CASAS_ENTRAMADAS', label_es: 'Casas entramadas' },
  'horreos': { type: 'tag', key: 'HORREOS', label_es: 'Hórreos' },
  'arquitectura-excavada': { type: 'tag', key: 'ARQUITECTURA_EXCAVADA', label_es: 'Arquitectura excavada' },

  'museo-singular': { type: 'tag', key: 'MUSEO_SINGULAR', label_es: 'Museo singular' },
  'bodega-subterranea': { type: 'tag', key: 'BODEGA_SUBTERRANEA', label_es: 'Bodega subterránea' },
  'horno-de-lena': { type: 'tag', key: 'HORNO_LENA', label_es: 'Horno de leña' },
  'fiesta-internacional': { type: 'tag', key: 'FIESTA_INTERES_INTERNACIONAL', label_es: 'Fiesta de interés internacional' },
  'fiesta-nacional': { type: 'tag', key: 'FIESTA_INTERES_NACIONAL', label_es: 'Fiesta de interés nacional' },
  'fiesta-regional': { type: 'tag', key: 'FIESTA_INTERES_REGIONAL', label_es: 'Fiesta de interés regional' },
  'denominacion-de-origen': { type: 'tag', key: 'DOP_IGP', label_es: 'Denominación de origen' },
  'ruta-del-vino': { type: 'tag', key: 'RUTA_VINO', label_es: 'Ruta del vino' },
  'mercadillo': { type: 'tag', key: 'MERCADILLO_FIN_DE_SEMANA', label_es: 'Mercadillo de fin de semana' },
  'artesania': { type: 'tag', key: 'ARTESANIA', label_es: 'Artesanía local' },

  'accesible': { type: 'tag', key: 'ACCESIBLE', label_es: 'Accesible' },
  'coworking': { type: 'tag', key: 'COWORKING', label_es: 'Coworking' },
  'camping': { type: 'tag', key: 'CAMPING_MUNICIPAL', label_es: 'Camping' },

  'parking': { type: 'servicio', key: 'PARKING', label_es: 'Aparcamiento' },
  'oficina-de-turismo': { type: 'servicio', key: 'TURISMO', label_es: 'Oficina de turismo' },
  'farmacia': { type: 'servicio', key: 'FARMACIA', label_es: 'Farmacia' },
  'hospital': { type: 'servicio', key: 'HOSPITAL', label_es: 'Centro de salud' },
  'cargador-electrico': { type: 'servicio', key: 'COCHE_ELECTRICO', label_es: 'Cargador eléctrico' },
  'cargador-ultra-rapido': { type: 'servicio', key: 'COCHE_ELECTRICO_ULTRA', label_es: 'Cargador ultra-rápido' },
  'area-de-caravanas': { type: 'servicio', key: 'CARAVANAS', label_es: 'Área de caravanas' },
  'supermercado': { type: 'servicio', key: 'SUPERMERCADO', label_es: 'Supermercado' },
  'cajero': { type: 'servicio', key: 'BANCO', label_es: 'Banco / Cajero' },
  'gasolinera': { type: 'servicio', key: 'GASOLINERA', label_es: 'Gasolinera' },
  'lavabos-publicos': { type: 'servicio', key: 'LAVABO', label_es: 'Lavabos públicos' },
  'autobus': { type: 'servicio', key: 'AUTOBUS', label_es: 'Autobús' },
  'taxi': { type: 'servicio', key: 'TAXI', label_es: 'Taxi' },
  'tren': { type: 'servicio', key: 'TREN', label_es: 'Tren' },
  'alquiler-bici': { type: 'servicio', key: 'ALQUILER_BICI', label_es: 'Alquiler de bicicletas' },
  'pipican': { type: 'servicio', key: 'PIPICAN', label_es: 'Pipicán' },
  'parque-infantil': { type: 'servicio', key: 'PARQUE_INFANTIL', label_es: 'Parque infantil' },
  'zona-picnic': { type: 'servicio', key: 'PICNIC', label_es: 'Zona de picnic' },
  'bano-natural': { type: 'servicio', key: 'BANO_NATURAL', label_es: 'Baño natural' },
  'playa': { type: 'servicio', key: 'PLAYA', label_es: 'Playa' },
  'fuente-de-agua': { type: 'servicio', key: 'FUENTE', label_es: 'Fuente de agua' },
  'policia': { type: 'servicio', key: 'POLICIA', label_es: 'Policía' },
  'desfibrilador': { type: 'servicio', key: 'DESFIBRILADOR', label_es: 'Desfibrilador' },
};

export const LOCATION_SLUG_MAP: Record<string, LocationMapping> = {
  'norte': { type: 'region', key: 'norte', label_es: 'Norte de España' },
  'sur': { type: 'region', key: 'sur', label_es: 'Sur de España' },
  'este': { type: 'region', key: 'este', label_es: 'Este de España' },
  'centro': { type: 'region', key: 'centro', label_es: 'Centro de España' },

  'andalucia': { type: 'comunidad', key: 'Andalucía', label_es: 'Andalucía' },
  'aragon': { type: 'comunidad', key: 'Aragón', label_es: 'Aragón' },
  'asturias': { type: 'comunidad', key: 'Principado de Asturias', label_es: 'Asturias' },
  'baleares': { type: 'comunidad', key: 'Islas Baleares', label_es: 'Islas Baleares' },
  'canarias': { type: 'comunidad', key: 'Canarias', label_es: 'Canarias' },
  'cantabria': { type: 'comunidad', key: 'Cantabria', label_es: 'Cantabria' },
  'castilla-la-mancha': { type: 'comunidad', key: 'Castilla - La Mancha', label_es: 'Castilla-La Mancha' },
  'castilla-y-leon': { type: 'comunidad', key: 'Castilla y León', label_es: 'Castilla y León' },
  'cataluna': { type: 'comunidad', key: 'Cataluña', label_es: 'Cataluña' },
  'extremadura': { type: 'comunidad', key: 'Extremadura', label_es: 'Extremadura' },
  'galicia': { type: 'comunidad', key: 'Galicia', label_es: 'Galicia' },
  'la-rioja': { type: 'comunidad', key: 'La Rioja', label_es: 'La Rioja' },
  'madrid': { type: 'comunidad', key: 'Comunidad de Madrid', label_es: 'Madrid' },
  'navarra': { type: 'comunidad', key: 'Comunidad Foral de Navarra', label_es: 'Navarra' },
  'pais-vasco': { type: 'comunidad', key: 'País Vasco', label_es: 'País Vasco' },
  'valencia': { type: 'comunidad', key: 'Comunidad Valenciana', label_es: 'Comunidad Valenciana' },
};

export function parseExplorarSlug(segments: string[]): {
  filter: FilterMapping | null;
  location: LocationMapping | null;
} {
  if (segments.length === 0) return { filter: null, location: null };

  const first = segments[0];
  const filter = FILTER_SLUG_MAP[first] ?? null;

  let location: LocationMapping | null = null;
  if (segments.length >= 2) {
    location = LOCATION_SLUG_MAP[segments[1]] ?? null;
  }

  if (!filter && !location) {
    location = LOCATION_SLUG_MAP[first] ?? null;
  }

  return { filter, location };
}

export function filterToSlug(type: FilterType, key: string): string | null {
  for (const [slug, m] of Object.entries(FILTER_SLUG_MAP)) {
    if (m.type === type && m.key === key) return slug;
  }
  return null;
}

export function locationToSlug(type: LocationType, key: string): string | null {
  for (const [slug, m] of Object.entries(LOCATION_SLUG_MAP)) {
    if (m.type === type && m.key === key) return slug;
  }
  return null;
}

export function buildExplorarTitle(
  filter: FilterMapping | null,
  location: LocationMapping | null,
  total: number,
): string {
  const parts: string[] = [];
  if (filter) {
    parts.push(`Pueblos con ${filter.label_es.toLowerCase()}`);
  } else {
    parts.push('Explorar pueblos');
  }
  if (location) {
    parts.push(`en ${location.label_es}`);
  } else if (filter) {
    parts.push('en España');
  }
  return `${parts.join(' ')} — Los Pueblos Más Bonitos de España`;
}

export function buildExplorarDescription(
  filter: FilterMapping | null,
  location: LocationMapping | null,
  total: number,
): string {
  if (filter && location) {
    return `Descubre ${total} pueblo${total !== 1 ? 's' : ''} con ${filter.label_es.toLowerCase()} en ${location.label_es}. Datos de primera mano, fotos y servicios del visitante.`;
  }
  if (filter) {
    return `${total} pueblo${total !== 1 ? 's' : ''} con ${filter.label_es.toLowerCase()} en España. Explora patrimonio, naturaleza y servicios de cada municipio.`;
  }
  if (location) {
    return `Explora los pueblos más bonitos de España en ${location.label_es}. Filtra por patrimonio, naturaleza, servicios y más.`;
  }
  return 'Explora los 126 pueblos más bonitos de España. Filtra por patrimonio, naturaleza, servicios del visitante y ubicación.';
}
