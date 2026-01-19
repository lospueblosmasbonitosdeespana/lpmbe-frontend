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
export function formatDateTimeEs(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

/**
 * Formatea rango de fechas para eventos
 * - Mismo día: "15 ene 2026 · 10:00 — 20:00"
 * - Varios días: "15 ene 2026 · 10:00 — 17 ene 2026 · 20:00"
 * - Solo inicio: "15 ene 2026 · 10:00"
 */
export function formatEventoRangeEs(fechaInicioIso: string, fechaFinIso?: string | null): string {
  const ini = new Date(fechaInicioIso);
  const fin = fechaFinIso ? new Date(fechaFinIso) : null;

  const iniDate = ini.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const iniTime = ini.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  if (!fin) return `${iniDate} · ${iniTime}`;

  const finDate = fin.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  const finTime = fin.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const sameDay =
    ini.getFullYear() === fin.getFullYear() &&
    ini.getMonth() === fin.getMonth() &&
    ini.getDate() === fin.getDate();

  if (sameDay) return `${iniDate} · ${iniTime} — ${finTime}`;
  return `${iniDate} · ${iniTime} — ${finDate} · ${finTime}`;
}
