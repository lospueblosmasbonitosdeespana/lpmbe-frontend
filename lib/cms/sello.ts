// Tipos para el CMS de "El Sello"

export type SelloPageKey =
  | 'SELLO_HOME'
  | 'SELLO_COMO_SE_OBTIENE'
  | 'SELLO_PROCESO'
  | 'SELLO_CRITERIOS'
  | 'SELLO_QUIENES_SOMOS'
  | 'SELLO_SOCIOS'
  | 'SELLO_INTERNACIONAL'
  | 'SELLO_UNETE';

export type CmsDocType =
  | 'ESTATUTOS'
  | 'CARTA_CALIDAD'
  | 'REGLAMENTO'
  | 'MEMORIA'
  | 'OTROS';

export type SelloPage = {
  key: SelloPageKey;
  titulo: string;
  subtitle?: string | null;
  heroUrl?: string | null;
  contenido: string;
};

export type CmsDocumento = {
  id: number;
  titulo: string;
  type: CmsDocType;
  url: string;
  orden: number;
  publicado: boolean;
  createdAt: string;
  updatedAt: string;
};

// Mapper de rutas a keys
export const ROUTE_TO_KEY: Record<string, SelloPageKey> = {
  '/el-sello': 'SELLO_HOME',
  '/el-sello/como-se-obtiene': 'SELLO_COMO_SE_OBTIENE',
  '/el-sello/proceso': 'SELLO_PROCESO',
  '/el-sello/criterios': 'SELLO_CRITERIOS',
  '/el-sello/quienes-somos': 'SELLO_QUIENES_SOMOS',
  '/el-sello/socios': 'SELLO_SOCIOS',
  '/el-sello/internacional': 'SELLO_INTERNACIONAL',
  '/el-sello/unete': 'SELLO_UNETE',
};

// Labels para mostrar en UI
export const SELLO_PAGE_LABELS: Record<SelloPageKey, string> = {
  SELLO_HOME: 'El Sello (Home)',
  SELLO_COMO_SE_OBTIENE: '¿Cómo se obtiene?',
  SELLO_PROCESO: 'Proceso de selección',
  SELLO_CRITERIOS: 'Criterios de evaluación',
  SELLO_QUIENES_SOMOS: 'Quiénes somos',
  SELLO_SOCIOS: 'Socios',
  SELLO_INTERNACIONAL: 'El sello en el mundo',
  SELLO_UNETE: 'Únete',
};

export const DOC_TYPE_LABELS: Record<CmsDocType, string> = {
  ESTATUTOS: 'Estatutos',
  CARTA_CALIDAD: 'Carta de Calidad',
  REGLAMENTO: 'Reglamento',
  MEMORIA: 'Memoria Anual',
  OTROS: 'Otros',
};

// Helper para obtener la key desde una ruta
export function getKeyFromRoute(route: string): SelloPageKey | null {
  return ROUTE_TO_KEY[route] ?? null;
}
