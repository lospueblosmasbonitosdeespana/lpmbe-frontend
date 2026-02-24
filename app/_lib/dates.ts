// ============================================================
// HELPERS DE FECHAS Y TIMEZONE
// ============================================================

/**
 * Convierte ISO string a formato datetime-local (YYYY-MM-DDTHH:mm)
 * Para pre-cargar inputs type="datetime-local"
 */
export function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Convierte datetime-local (YYYY-MM-DDTHH:mm) a ISO UTC
 * IMPORTANTE: interpreta el valor como hora local y convierte a UTC correctamente
 */
export function datetimeLocalToIsoUtc(value: string): string {
  // value: "2026-02-15T10:00"
  const [datePart, timePart] = value.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = timePart.split(':').map(Number);
  const local = new Date(y, m - 1, d, hh, mm, 0, 0);
  return local.toISOString();
}

/**
 * Formatea fecha con hora para mostrar al usuario
 * Ejemplo: "15 ene 2026 · 10:00"
 */
export function formatDateTimeEs(iso: string, locale = 'es'): string {
  const d = new Date(iso);
  const bcp47 = localeToBcp47(locale);
  const date = d.toLocaleDateString(bcp47, { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString(bcp47, { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

/**
 * Formatea rango de fechas para eventos en el locale del usuario.
 * - Mismo día: "28 Feb 2026 · 17:00 — 20:00"
 * - Varios días: "11 Apr 2026 · 07:00 — 12 Apr 2026 · 16:00"
 * - Solo inicio: "28 Feb 2026 · 17:00"
 */
export function formatEventoRangeEs(fechaInicioIso: string, fechaFinIso?: string | null, locale = 'es'): string {
  const ini = new Date(fechaInicioIso);
  const fin = fechaFinIso ? new Date(fechaFinIso) : null;
  const bcp47 = localeToBcp47(locale);

  const iniDate = ini.toLocaleDateString(bcp47, { day: '2-digit', month: 'short', year: 'numeric' });
  const iniTime = ini.toLocaleTimeString(bcp47, { hour: '2-digit', minute: '2-digit' });

  if (!fin) return `${iniDate} · ${iniTime}`;

  const finDate = fin.toLocaleDateString(bcp47, { day: '2-digit', month: 'short', year: 'numeric' });
  const finTime = fin.toLocaleTimeString(bcp47, { hour: '2-digit', minute: '2-digit' });

  const sameDay =
    ini.getFullYear() === fin.getFullYear() &&
    ini.getMonth() === fin.getMonth() &&
    ini.getDate() === fin.getDate();

  if (sameDay) return `${iniDate} · ${iniTime} — ${finTime}`;
  return `${iniDate} · ${iniTime} — ${finDate} · ${finTime}`;
}

/** Convierte nuestros locales internos a BCP-47 que entiende Intl */
function localeToBcp47(locale: string): string {
  const map: Record<string, string> = {
    es: 'es-ES', en: 'en-GB', fr: 'fr-FR',
    de: 'de-DE', pt: 'pt-PT', it: 'it-IT',
  };
  return map[locale] ?? 'es-ES';
}
