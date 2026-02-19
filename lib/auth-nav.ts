/**
 * Configuración de navegación según rol.
 * Reutilizable en web y app móvil.
 *
 * - Mi cuenta: entorno personal (todos los usuarios logueados)
 * - Gestión: entorno pueblo/asociación (solo ADMIN, ALCALDE, CLIENTE)
 *
 * En la app, alcaldes pueden necesitar alternar entre Mi cuenta (personal)
 * y Gestión (pueblo, ej. escanear QR Club de Amigos).
 */

export type UserRol = 'USUARIO' | 'ALCALDE' | 'ADMIN' | 'CLIENTE' | 'COLABORADOR';

/** Roles que ven el botón/enlace Gestión */
export const ROLES_CON_GESTION: UserRol[] = ['ADMIN', 'ALCALDE', 'CLIENTE', 'COLABORADOR'];

export function shouldShowGestion(rol: UserRol | string | null | undefined): boolean {
  return ROLES_CON_GESTION.includes((rol ?? '') as UserRol);
}

/** URL de Gestión según rol: CLIENTE va a /cuenta, resto a /gestion */
export function getGestionHref(rol: UserRol | string | null | undefined): string {
  return rol === 'CLIENTE' ? '/cuenta' : '/gestion';
}
