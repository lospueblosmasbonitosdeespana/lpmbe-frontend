/**
 * Cuenta atrás en vivo para bloques "contador" del constructor (HTML estático en BD).
 * - Formato nuevo: data-lpbme-countdown-end + spans .lpbme-cd-d/h/m/s
 * - Formato antiguo: tabla 4 celdas (Días/Horas/Min/Seg) + fecha en es-ES en un <p>
 */

const CD_UNITS = ['d', 'h', 'm', 's'] as const;

/** "29/5/2026, 10:00:00" (es-ES) → timestamp ms */
export function parseEsESDateTime(text: string): number | null {
  const s = text.trim();
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const h = Number(m[4]);
  const mi = Number(m[5]);
  const sec = Number(m[6]);
  const t = new Date(y, mo - 1, d, h, mi, sec).getTime();
  return Number.isNaN(t) ? null : t;
}

function isLegacyTableCountdown(div: HTMLElement): boolean {
  if (div.getAttribute('data-lpbme-countdown-end')) return false;
  const table = div.querySelector(':scope > table');
  if (!table) return false;
  const tr = table.querySelector('tr');
  if (!tr) return false;
  const tds = tr.querySelectorAll('td');
  if (tds.length !== 4) return false;
  const labels = [...tds].map((td) => {
    const spans = td.querySelectorAll('span');
    const labelSpan = spans[1] ?? spans[0];
    return (labelSpan?.textContent ?? '').trim().toLowerCase();
  });
  return (
    labels[0].includes('día') &&
    labels[1].includes('hora') &&
    labels[2].includes('min') &&
    labels[3].includes('seg')
  );
}

function findLegacyDateParagraph(div: HTMLElement): HTMLParagraphElement | null {
  const children = [...div.children];
  for (let i = children.length - 1; i >= 0; i--) {
    const c = children[i];
    if (c.tagName !== 'P') continue;
    const txt = c.textContent ?? '';
    if (/\d{1,2}\/\d{1,2}\/\d{4}/.test(txt)) {
      return c as HTMLParagraphElement;
    }
  }
  return null;
}

/** Añade data-lpbme-countdown-end y clases en spans numéricos (HTML ya guardado). */
export function upgradeLegacyCountdownBlocks(root: HTMLElement): void {
  const candidates = root.querySelectorAll<HTMLDivElement>('div');
  candidates.forEach((div) => {
    if (!isLegacyTableCountdown(div)) return;
    const dateP = findLegacyDateParagraph(div);
    if (!dateP) return;
    const endMs = parseEsESDateTime(dateP.textContent ?? '');
    if (endMs == null) return;
    div.setAttribute('data-lpbme-countdown', '1');
    div.setAttribute('data-lpbme-countdown-end', new Date(endMs).toISOString());

    const tr = div.querySelector('table tr');
    if (!tr) return;
    const tds = tr.querySelectorAll('td');
    CD_UNITS.forEach((unit, i) => {
      const td = tds[i];
      const numSpan = td?.querySelector('span');
      if (numSpan) numSpan.classList.add(`lpbme-cd-${unit}`);
    });
  });
}

function setCountdownDigits(
  root: HTMLElement,
  endMs: number,
): void {
  const dEl = root.querySelector('.lpbme-cd-d');
  const hEl = root.querySelector('.lpbme-cd-h');
  const mEl = root.querySelector('.lpbme-cd-m');
  const sEl = root.querySelector('.lpbme-cd-s');
  if (!dEl || !hEl || !mEl || !sEl) return;

  const diff = Math.max(0, endMs - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  dEl.textContent = String(days).padStart(2, '0');
  hEl.textContent = String(hours).padStart(2, '0');
  mEl.textContent = String(mins).padStart(2, '0');
  sEl.textContent = String(secs).padStart(2, '0');
}

/** Intervalos 1s para cada bloque con data-lpbme-countdown-end. */
export function attachLiveCountdowns(root: HTMLElement): () => void {
  const timers: ReturnType<typeof setInterval>[] = [];

  root.querySelectorAll<HTMLElement>('[data-lpbme-countdown-end]').forEach((el) => {
    const raw = el.getAttribute('data-lpbme-countdown-end');
    if (!raw) return;
    const endMs = new Date(raw).getTime();
    if (Number.isNaN(endMs)) return;

    const tick = () => setCountdownDigits(el, endMs);
    tick();
    timers.push(setInterval(tick, 1000));
  });

  return () => {
    timers.forEach(clearInterval);
  };
}
