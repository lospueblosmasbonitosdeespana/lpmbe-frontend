const HOLY_WEEK_DAY_KEYS: Record<string, string> = {
  'domingo de ramos': 'dayPalmSunday',
  'lunes santo': 'dayHolyMonday',
  'martes santo': 'dayHolyTuesday',
  'miercoles santo': 'dayHolyWednesday',
  'miércoles santo': 'dayHolyWednesday',
  'jueves santo': 'dayHolyThursday',
  'viernes santo': 'dayGoodFriday',
  'sabado santo': 'dayHolySaturday',
  'sábado santo': 'dayHolySaturday',
  'domingo de resurreccion': 'dayEasterSunday',
  'domingo de resurrección': 'dayEasterSunday',
  'domingo de pascua': 'dayEasterSunday',
  'lunes de pascua': 'dayEasterMonday',
};

function normalizeDayLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function translateHolyWeekDayLabel(
  rawLabel: string | null | undefined,
  t: (key: string) => string,
): string {
  const value = String(rawLabel ?? '').trim();
  if (!value) return '';
  const key = HOLY_WEEK_DAY_KEYS[normalizeDayLabel(value)];
  if (!key) return value;
  return t(key);
}
