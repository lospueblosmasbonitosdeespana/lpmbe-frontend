/**
 * Utilidades para gestionar la "visibilidad y orden" de las secciones de
 * una página premium (restaurante / hotel / actividad / comercio).
 *
 * Convención: cada landingConfig.v0 puede llevar un campo `_layout` opcional
 * con la lista de secciones en el orden que el negocio quiere y un flag
 * `visible`. Si no existe o es inválido, se reconstruye con el orden por
 * defecto del template y todo visible.
 */

export interface SectionLayoutItem {
  key: string
  visible: boolean
}

/**
 * Devuelve un layout válido para `defaultKeys`:
 *  - respeta el orden y visibilidad indicados en `raw` para las claves
 *    conocidas
 *  - descarta claves desconocidas u obsoletas
 *  - añade al final, como visibles, las claves del template que aún no
 *    estén en el layout guardado (p. ej. al añadir nuevas secciones a un
 *    template existente)
 */
export function resolveLayout(
  raw: unknown,
  defaultKeys: readonly string[],
): SectionLayoutItem[] {
  const known = new Set(defaultKeys)
  const seen = new Set<string>()
  const ordered: SectionLayoutItem[] = []

  if (Array.isArray(raw)) {
    for (const it of raw) {
      if (!it || typeof it !== 'object') continue
      const key = (it as { key?: unknown }).key
      if (typeof key !== 'string' || !known.has(key) || seen.has(key)) continue
      seen.add(key)
      const visible = (it as { visible?: unknown }).visible !== false
      ordered.push({ key, visible })
    }
  }

  for (const k of defaultKeys) {
    if (!seen.has(k)) ordered.push({ key: k, visible: true })
  }
  return ordered
}

export function getDefaultLayout(
  defaultKeys: readonly string[],
): SectionLayoutItem[] {
  return defaultKeys.map((key) => ({ key, visible: true }))
}

export function isLayoutEqual(
  a: SectionLayoutItem[],
  b: SectionLayoutItem[],
): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i].key !== b[i].key) return false
    if (a[i].visible !== b[i].visible) return false
  }
  return true
}
