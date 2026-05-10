/**
 * Tipos espejo del backend para el panel /gestion/agentes.
 * Se mantienen alineados con `backend/src/agentes/agentes.types.ts`.
 */

export type AgenteCategoria =
  | 'INSTITUCIONAL'
  | 'CONTENIDO'
  | 'GAMIFICACION'
  | 'TURISTAS'
  | 'NEGOCIOS'
  | 'CALIDAD'
  | 'INTERNO';

export type AgenteEstado =
  | 'EN_CURSO'
  | 'OK'
  | 'ERROR'
  | 'PENDIENTE_REVISION'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'CANCELADA';

export interface AgenteAdminView {
  nombre: string;
  titulo: string;
  descripcion: string;
  categoria: AgenteCategoria;
  implementado: boolean;
  activo: boolean;
  cronExprEfectivo: string | null;
  modeloIaEfectivo: string;
  presupuestoMensualEur: number;
  gastoMesActualEur: number;
  ejecucionesMesActual: number;
  requiereRevisionHumana: boolean;
  ultimaEjecucionAt: string | null;
  ultimoIntentoAt: string | null;
  ultimoEstado: AgenteEstado | null;
  notas: string | null;
}

export interface AgenteEjecucion {
  id: number;
  agenteNombre: string;
  estado: AgenteEstado;
  trigger: string;
  triggeredByUserId: number | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  modeloIa: string | null;
  tokensInput: number | null;
  tokensOutput: number | null;
  costeEstimadoEur: string | null;
  input: unknown;
  output: unknown;
  errorMensaje: string | null;
  recursoTipo: string | null;
  recursoId: string | null;
  notasRevision: string | null;
  revisadoPorUserId: number | null;
  revisadoAt: string | null;
}

export const CATEGORIA_LABEL: Record<AgenteCategoria, string> = {
  INSTITUCIONAL: 'Institucional',
  CONTENIDO: 'Contenido',
  GAMIFICACION: 'Gamificación',
  TURISTAS: 'Turistas',
  NEGOCIOS: 'Negocios',
  CALIDAD: 'Calidad',
  INTERNO: 'Interno',
};

export const ESTADO_LABEL: Record<AgenteEstado, string> = {
  EN_CURSO: 'En curso',
  OK: 'OK',
  ERROR: 'Error',
  PENDIENTE_REVISION: 'Pendiente revisión',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
};
