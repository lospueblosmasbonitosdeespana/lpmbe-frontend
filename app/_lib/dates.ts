// ============================================================
// HELPERS DE FECHAS Y TIMEZONE
// Todas las funciones de display fuerzan timeZone: 'Europe/Madrid'
// para que Vercel (UTC) muestre las horas correctas de España.
// ============================================================

const TZ = 'Europe/Madrid';

/**
 * Convierte ISO string a formato datetime-local (YYYY-MM-DDTHH:mm)
 * Para pre-cargar inputs type="datetime-local"
 * Fuerza timezone España para que funcione igual en servidor y cliente.
 */
export function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/**
 * Convierte datetime-local (YYYY-MM-DDTHH:mm) a ISO UTC
 * Interpreta el valor como hora de España y convierte a UTC.
 */
export function datetimeLocalToIsoUtc(value: string): string {
  const [datePart, timePart] = value.split('T');
  const hh = timePart ? timePart.split(':')[0] : '12';
  const mm = timePart ? timePart.split(':')[1] : '00';
  return madridToUtcIso(datePart, parseInt(hh, 10), parseInt(mm, 10));
}

/**
 * Convierte fecha + hora en timezone Europe/Madrid a ISO UTC string.
 */
function madridToUtcIso(datePart: string, hour: number, minute: number): string {
  const [y, m, d] = datePart.split('-').map(Number);
  // Crear fecha UTC tentativa y calcular offset real de Madrid para ese momento
  const tentativeUtc = new Date(Date.UTC(y, m - 1, d, hour, minute, 0, 0));
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(tentativeUtc);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);
  const madridH = get('hour');
  const madridM = get('minute');
  // Diferencia entre lo que queremos (hour:minute) y lo que Madrid muestra
  const diffMinutes = (hour * 60 + minute) - (madridH * 60 + madridM);
  return new Date(tentativeUtc.getTime() + diffMinutes * 60_000).toISOString();
}

/**
 * Formatea fecha con hora para mostrar al usuario
 * Ejemplo: "15 ene 2026 · 10:00"
 */
export function formatDateTimeEs(iso: string, locale = 'es'): string {
  const d = new Date(iso);
  const bcp47 = localeToBcp47(locale);
  const date = d.toLocaleDateString(bcp47, { day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ });
  const time = d.toLocaleTimeString(bcp47, { hour: '2-digit', minute: '2-digit', timeZone: TZ });
  return `${date} · ${time}`;
}

/**
 * Formatea rango de fechas para eventos en el locale del usuario.
 * Si la hora es 12:00 y los minutos son 0 (convención de "solo fecha"), omite la hora.
 * - Mismo día con hora: "28 mar 2026 · 17:00 — 20:00"
 * - Mismo día sin hora: "28 mar 2026"
 * - Varios días con hora: "11 abr 2026 · 07:00 — 12 abr 2026 · 16:00"
 * - Varios días sin hora: "11 abr 2026 — 12 abr 2026"
 */
export function formatEventoRangeEs(fechaInicioIso: string, fechaFinIso?: string | null, locale = 'es'): string {
  const ini = new Date(fechaInicioIso);
  const fin = fechaFinIso ? new Date(fechaFinIso) : null;
  const bcp47 = localeToBcp47(locale);

  const opts = { timeZone: TZ } as const;
  const iniDate = ini.toLocaleDateString(bcp47, { day: '2-digit', month: 'short', year: 'numeric', ...opts });
  const iniTime = ini.toLocaleTimeString(bcp47, { hour: '2-digit', minute: '2-digit', ...opts });

  const iniIsAllDay = isAllDayMarker(ini);

  if (!fin) {
    return iniIsAllDay ? iniDate : `${iniDate} · ${iniTime}`;
  }

  const finDate = fin.toLocaleDateString(bcp47, { day: '2-digit', month: 'short', year: 'numeric', ...opts });
  const finTime = fin.toLocaleTimeString(bcp47, { hour: '2-digit', minute: '2-digit', ...opts });
  const finIsAllDay = isAllDayMarker(fin);

  const sameDay =
    iniDate === finDate;

  if (sameDay) {
    if (iniIsAllDay && finIsAllDay) return iniDate;
    return `${iniDate} · ${iniTime} — ${finTime}`;
  }

  if (iniIsAllDay && finIsAllDay) return `${iniDate} — ${finDate}`;
  return `${iniDate} · ${iniTime} — ${finDate} · ${finTime}`;
}

/**
 * Detecta si una fecha almacenada es marcador de "todo el día" (12:00 Madrid)
 */
function isAllDayMarker(d: Date): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const h = parts.find((p) => p.type === 'hour')?.value;
  const m = parts.find((p) => p.type === 'minute')?.value;
  return h === '12' && m === '00';
}

/** Convierte nuestros locales internos a BCP-47 que entiende Intl */
function localeToBcp47(locale: string): string {
  const map: Record<string, string> = {
    es: 'es-ES', en: 'en-GB', fr: 'fr-FR',
    de: 'de-DE', pt: 'pt-PT', it: 'it-IT',
    ca: 'ca-ES',
  };
  return map[locale] ?? 'es-ES';
}
