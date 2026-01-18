import { CCAA } from "@/app/_components/pueblos/ccaa.config";

/**
 * Normaliza un string para matching (lowercase, sin tildes)
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Obtiene la URL de la bandera de una comunidad autónoma
 * dado su nombre completo (ej: "Canarias", "País Vasco", etc.)
 *
 * @param comunidadName - Nombre de la comunidad (puede venir con tildes, mayúsculas, etc.)
 * @returns URL de la bandera o null si no se encuentra
 */
export function getComunidadFlagSrc(comunidadName: string | null | undefined): string | null {
  if (!comunidadName) return null;

  const normalized = normalize(comunidadName);

  const ccaa = CCAA.find((c) => normalize(c.name) === normalized);

  return ccaa?.flagSrc ?? null;
}
