// Helper para manejo de precios y moneda

/**
 * Convierte un valor a número de forma segura.
 * Si el valor es null, undefined o no es un número válido, devuelve 0.
 */
export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Formatea un valor como precio en euros (2 decimales).
 * Ejemplo: formatEUR(59.95) => "59.95"
 */
export function formatEUR(value: string | number | null | undefined): string {
  return toNumber(value).toFixed(2);
}
