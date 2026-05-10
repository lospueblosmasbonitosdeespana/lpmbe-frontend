// Espejo ligero de los tipos del backend (Prisma) para la UI admin.
// Solo lectura: la lista no se traduce (panel admin → ES hardcodeado).

export type SubvencionRelevancia =
  | 'ALTA'
  | 'MEDIA'
  | 'BAJA'
  | 'NO_RELEVANTE'
  | 'PENDIENTE_ANALISIS';

export type SubvencionEstado =
  | 'DETECTADA'
  | 'EN_REVISION'
  | 'EN_PREPARACION'
  | 'SOLICITADA'
  | 'DESCARTADA'
  | 'CONCEDIDA'
  | 'DENEGADA';

export type SubvencionAmbito =
  | 'ESTADO'
  | 'COMUNIDAD_AUTONOMA'
  | 'ENTIDAD_LOCAL'
  | 'UE'
  | 'OTRO';

export interface SubvencionRow {
  id: number;
  bdnsId: string;
  numeroConvocatoria: string | null;
  fechaRecepcion: string;
  urlBdns: string | null;
  nivel1: string;
  nivel2: string | null;
  nivel3: string | null;
  ambito: SubvencionAmbito;
  descripcion: string;
  descripcionFinalidad: string | null;
  tipoConvocatoria: string | null;
  presupuestoTotalEur: string | null; // Decimal serializado
  tiposBeneficiarios: string[] | null;
  regiones: string[] | null;
  sectores: string[] | null;
  fondos: string[] | null;
  textoPlazoInicio: string | null;
  textoPlazoFin: string | null;
  fechaInicioSolicitud: string | null;
  fechaFinSolicitud: string | null;
  abierto: boolean | null;
  mrr: boolean;
  urlBasesReguladoras: string | null;
  documentos: any | null;
  relevanciaIa: SubvencionRelevancia;
  categoriaIa: string | null;
  motivoIa: string | null;
  modeloIa: string | null;
  analizadaAt: string | null;
  estadoTramitacion: SubvencionEstado;
  notas: string | null;
  notificada: boolean;
  notificadaAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubvencionListResponse {
  items: SubvencionRow[];
  total: number;
  limit: number;
  offset: number;
  kpis: {
    total: number;
    alta: number;
    media: number;
    enPreparacion: number;
    solicitadas: number;
    /** Convocatorias ALTA detectadas en los últimos 7 días (badge "novedad"). */
    nuevasAlta7d: number;
  };
}
