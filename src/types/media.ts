// Tipos para el sistema de media unificado con Cloudflare R2

export type MediaOwnerType = 
  | 'pueblo' 
  | 'poi' 
  | 'producto' 
  | 'ruta' 
  | 'multiexperiencia'
  | 'parada'
  | 'contenido'
  | 'evento'
  | 'noticia'
  | 'usuario'
  | 'ajustes'
  | 'home'
  | 'sello'
  | 'documento';

export type MediaItem = {
  id: number;
  ownerType: MediaOwnerType;
  ownerId: number;
  publicUrl: string;
  altText?: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type MediaUploadResponse = {
  id: number;
  publicUrl: string;
  ownerType: MediaOwnerType;
  ownerId: number;
  order: number;
};

export type MediaListResponse = {
  media: MediaItem[];
};

// Función helper para normalizar arrays de media
export function normalizeMediaArray(media: MediaItem[] | undefined | null): MediaItem[] {
  return Array.isArray(media) ? media : [];
}

// Función helper para obtener la URL de la primera imagen
export function getFirstMediaUrl(media: MediaItem[] | undefined | null): string | null {
  const normalized = normalizeMediaArray(media);
  return normalized.length > 0 ? normalized[0].publicUrl : null;
}

// Función helper para ordenar media
export function sortMediaByOrder(media: MediaItem[]): MediaItem[] {
  return [...media].sort((a, b) => a.order - b.order);
}
