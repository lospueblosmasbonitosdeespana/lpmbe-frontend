export type NotificacionTipo =
  | 'NOTICIA_ASOCIACION'
  | 'SEMAFORO';

export interface NotificacionFeedItem {
  tipo: NotificacionTipo;
  refId: string;
  fecha: string;
  titulo: string;
  resumen?: string;
  imagen?: string;
  link?: string;

  pueblo?: {
    id: number;
    nombre: string;
    slug: string;
  };

  semaforo?: {
    estado: 'VERDE' | 'AMARILLO' | 'ROJO';
    mensaje?: string;
  };
}