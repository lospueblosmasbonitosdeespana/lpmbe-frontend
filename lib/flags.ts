// frontend/lib/flags.ts
import { CCAA } from '@/app/_components/pueblos/ccaa.config';

function normalizeForMatch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ');
}

/** Alias de nombres de comunidad que usa el backend vs CCAA */
const ALIASES: Record<string, string> = {
  'islas baleares': 'Illes Balears',
};

/** Resuelve la URL de la bandera de una comunidad autónoma por su nombre */
export function getComunidadFlagSrc(comunidad?: string | null): string | null {
  if (!comunidad || typeof comunidad !== 'string') return null;
  const norm = normalizeForMatch(comunidad);
  const nameToMatch = ALIASES[norm] ?? comunidad;
  const ccaa = CCAA.find((c) => {
    if (!c.flagSrc) return false;
    return normalizeForMatch(c.name) === normalizeForMatch(nameToMatch);
  });
  return ccaa?.flagSrc ?? null;
}
