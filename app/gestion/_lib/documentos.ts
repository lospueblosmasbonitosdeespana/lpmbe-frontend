export type TipoDoc = 'LOGO' | 'PAPELERIA' | 'ORDENANZA' | 'OTRO';
export type TemaOrdenanza =
  | 'EMBELLECIMIENTO_ESTETICA'
  | 'RESIDUOS_BASURAS'
  | 'CIRCULACION_TRAFICO'
  | 'URBANISMO_CONSTRUCCION'
  | 'MEDIO_AMBIENTE'
  | 'CONVIVENCIA_CIUDADANA'
  | 'LICENCIAS_ACTIVIDADES'
  | 'HACIENDA_TRIBUTOS'
  | 'AGUAS_ALCANTARILLADO'
  | 'PROTECCION_ANIMAL'
  | 'ESPACIOS_PUBLICOS'
  | 'MERCADOS_FERIAS'
  | 'PATRIMONIO_CULTURAL'
  | 'RUIDO_VIBRACIONES'
  | 'SEGURIDAD_EMERGENCIAS'
  | 'LIMPIEZA_VIARIA'
  | 'ACCESIBILIDAD'
  | 'SANIDAD_SALUBRIDAD'
  | 'TURISMO_HOSTELERIA'
  | 'SERVICIOS_SOCIALES'
  | 'ENERGIA_RENOVABLES'
  | 'GENERAL_OTROS';

export type FuenteDocumento = 'PUEBLO' | 'ASOCIACION';

export const TIPO_LABELS: Record<TipoDoc, string> = {
  LOGO: 'Logotipo',
  PAPELERIA: 'Papelería',
  ORDENANZA: 'Ordenanza',
  OTRO: 'Otro documento',
};

export const TIPO_COLORS: Record<TipoDoc, string> = {
  LOGO: 'bg-blue-100 text-blue-700 border-blue-200',
  PAPELERIA: 'bg-purple-100 text-purple-700 border-purple-200',
  ORDENANZA: 'bg-amber-100 text-amber-700 border-amber-200',
  OTRO: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const TEMA_ORDENANZA_LABELS: Record<TemaOrdenanza, string> = {
  EMBELLECIMIENTO_ESTETICA: 'Embellecimiento y estética urbana',
  RESIDUOS_BASURAS: 'Residuos y basuras',
  CIRCULACION_TRAFICO: 'Circulación y tráfico',
  URBANISMO_CONSTRUCCION: 'Urbanismo y construcción',
  MEDIO_AMBIENTE: 'Medio ambiente',
  CONVIVENCIA_CIUDADANA: 'Convivencia ciudadana',
  LICENCIAS_ACTIVIDADES: 'Licencias y actividades económicas',
  HACIENDA_TRIBUTOS: 'Hacienda municipal y tributos',
  AGUAS_ALCANTARILLADO: 'Aguas y alcantarillado',
  PROTECCION_ANIMAL: 'Protección de animales',
  ESPACIOS_PUBLICOS: 'Uso de espacios públicos',
  MERCADOS_FERIAS: 'Mercados y ferias',
  PATRIMONIO_CULTURAL: 'Patrimonio cultural y arquitectónico',
  RUIDO_VIBRACIONES: 'Ruidos y vibraciones',
  SEGURIDAD_EMERGENCIAS: 'Seguridad y emergencias',
  LIMPIEZA_VIARIA: 'Limpieza viaria',
  ACCESIBILIDAD: 'Accesibilidad y movilidad',
  SANIDAD_SALUBRIDAD: 'Sanidad y salubridad',
  TURISMO_HOSTELERIA: 'Turismo y hostelería',
  SERVICIOS_SOCIALES: 'Servicios sociales',
  ENERGIA_RENOVABLES: 'Energía y renovables',
  GENERAL_OTROS: 'General / Otros',
};

export const TEMA_ORDENANZA_ICONS: Record<TemaOrdenanza, string> = {
  EMBELLECIMIENTO_ESTETICA: '🌸',
  RESIDUOS_BASURAS: '♻️',
  CIRCULACION_TRAFICO: '🚗',
  URBANISMO_CONSTRUCCION: '🏗️',
  MEDIO_AMBIENTE: '🌿',
  CONVIVENCIA_CIUDADANA: '🤝',
  LICENCIAS_ACTIVIDADES: '📋',
  HACIENDA_TRIBUTOS: '💰',
  AGUAS_ALCANTARILLADO: '💧',
  PROTECCION_ANIMAL: '🐾',
  ESPACIOS_PUBLICOS: '🏛️',
  MERCADOS_FERIAS: '🛒',
  PATRIMONIO_CULTURAL: '🏰',
  RUIDO_VIBRACIONES: '🔇',
  SEGURIDAD_EMERGENCIAS: '🚨',
  LIMPIEZA_VIARIA: '🧹',
  ACCESIBILIDAD: '♿',
  SANIDAD_SALUBRIDAD: '🏥',
  TURISMO_HOSTELERIA: '🏨',
  SERVICIOS_SOCIALES: '👥',
  ENERGIA_RENOVABLES: '⚡',
  GENERAL_OTROS: '📄',
};

export interface DocumentoItem {
  id: number;
  puebloId: number | null;
  nombre: string;
  url: string;
  tipo: TipoDoc;
  temaOrdenanza: TemaOrdenanza | null;
  fuente: FuenteDocumento;
  compartido: boolean;
  descripcion: string | null;
  createdAt: string;
  pueblo: { id: number; nombre: string; slug: string } | null;
}

export function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}

export function isPdfUrl(url: string) {
  return /\.pdf(\?|$)/i.test(url);
}
