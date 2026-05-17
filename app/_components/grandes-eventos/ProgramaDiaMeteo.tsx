'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Sun, CloudSun, Cloud, Cloudy, CloudFog, CloudDrizzle,
  CloudRain, CloudSnow, CloudLightning,
  Sunrise, SunMedium, Moon,
} from 'lucide-react';

type HourlyTempEntry = { time: string; tempC: number | null; weatherCode: number | null };

type MeteoResponse = {
  puebloId: number;
  hourlyTemp?: HourlyTempEntry[];
  daily?: Array<{ date: string; weatherCode: number | null }>;
};

type PuebloRef = { id: number; slug: string; nombre: string };

/**
 * A single slot: "at this hour, the delegates are in this pueblo."
 * - period: 'morning' (12h), 'afternoon' (18h), 'night' (0h next day)
 * - pueblo: where they are
 */
export type MeteoSlot = {
  pueblo: PuebloRef;
  period: 'morning' | 'afternoon' | 'night';
};

function getWmoIcon(code: number | null) {
  if (code === null || code === 0) return { Icon: Sun, cls: 'text-amber-500' };
  if (code === 1) return { Icon: CloudSun, cls: 'text-amber-400' };
  if ([2, 3].includes(code)) return { Icon: Cloudy, cls: 'text-stone-500' };
  if ([45, 48].includes(code)) return { Icon: CloudFog, cls: 'text-stone-400' };
  if ([51, 53, 55, 56, 57].includes(code)) return { Icon: CloudDrizzle, cls: 'text-slate-400' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { Icon: CloudRain, cls: 'text-blue-500' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { Icon: CloudSnow, cls: 'text-sky-400' };
  if ([95, 96, 99].includes(code)) return { Icon: CloudLightning, cls: 'text-violet-500' };
  return { Icon: Cloud, cls: 'text-stone-500' };
}

function getTempColor(tempC: number | null): string {
  if (tempC == null) return 'text-stone-800';
  if (tempC <= 5) return 'text-blue-700';
  if (tempC <= 14) return 'text-sky-700';
  if (tempC <= 22) return 'text-emerald-700';
  if (tempC <= 29) return 'text-amber-700';
  if (tempC <= 35) return 'text-orange-700';
  return 'text-red-700';
}

function getTempBg(tempC: number | null): string {
  if (tempC == null) return 'bg-stone-50';
  if (tempC <= 5) return 'bg-blue-50';
  if (tempC <= 14) return 'bg-sky-50';
  if (tempC <= 22) return 'bg-emerald-50/70';
  if (tempC <= 29) return 'bg-amber-50/80';
  if (tempC <= 35) return 'bg-orange-50/80';
  return 'bg-red-50/80';
}

const PERIOD_ICON = {
  morning: Sunrise,
  afternoon: SunMedium,
  night: Moon,
} as const;

const PERIOD_HOUR = { morning: '12', afternoon: '18', night: '00' } as const;

function MeteoChip({
  period,
  tempC,
  weatherCode,
  pueblo,
  periodLabel,
}: {
  period: 'morning' | 'afternoon' | 'night';
  tempC: number | null;
  weatherCode: number | null;
  pueblo: PuebloRef;
  periodLabel: string;
}) {
  const { Icon: WmoIcon, cls: wmoCls } = getWmoIcon(weatherCode);
  const PeriodIcon = PERIOD_ICON[period];
  const color = getTempColor(tempC);
  const bg = getTempBg(tempC);

  return (
    <a
      href={`/pueblos/${pueblo.slug}/meteo`}
      className={`group flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-stone-200/70 shadow-sm transition hover:shadow-md hover:ring-stone-400 ${bg}`}
      title={`${pueblo.nombre} — ${periodLabel}`}
    >
      <WmoIcon size={20} className={wmoCls} strokeWidth={1.5} />
      <span className={`text-base font-bold tabular-nums ${color}`}>
        {tempC != null ? `${Math.round(tempC)}°` : '—'}
      </span>
      <div className="flex flex-col leading-tight">
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
          <PeriodIcon className="h-3 w-3" />
          {periodLabel}
        </span>
        <span className="text-[10px] text-stone-400 group-hover:text-stone-600">
          {pueblo.nombre}
        </span>
      </div>
    </a>
  );
}

export default function ProgramaDiaMeteo({
  slots,
  targetDate,
}: {
  slots: MeteoSlot[];
  targetDate: string; // YYYY-MM-DD
}) {
  const t = useTranslations('granEvento.meteo');
  const [results, setResults] = useState<Map<number, HourlyTempEntry[]>>(new Map());
  const [loaded, setLoaded] = useState(false);

  const uniquePuebloIds = [...new Set(slots.map((s) => s.pueblo.id))];

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      const map = new Map<number, HourlyTempEntry[]>();
      await Promise.all(
        uniquePuebloIds.map(async (pid) => {
          try {
            const res = await fetch(`/api/meteo/pueblo-public/${pid}`, { cache: 'no-store' });
            if (!res.ok) return;
            const data: MeteoResponse = await res.json();
            if (data.hourlyTemp) map.set(pid, data.hourlyTemp);
          } catch { /* ignore */ }
        }),
      );
      if (!cancelled) { setResults(map); setLoaded(true); }
    }
    fetchAll();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate, uniquePuebloIds.join(',')]);

  if (!loaded) return null;

  const nextDay = new Date(targetDate + 'T00:00:00');
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDateStr = nextDay.toISOString().slice(0, 10);

  const rendered = slots.map((slot) => {
    const hourlyArr = results.get(slot.pueblo.id);
    if (!hourlyArr) return null;

    const targetHour = PERIOD_HOUR[slot.period];
    const dateForLookup = slot.period === 'night' ? nextDateStr : targetDate;
    const targetTime = `${dateForLookup}T${targetHour}:00`;

    const match = hourlyArr.find((h) => h.time === targetTime);
    if (!match) return null;

    const periodLabel =
      slot.period === 'morning' ? t('morning') :
      slot.period === 'afternoon' ? t('afternoon') :
      t('night');

    return (
      <MeteoChip
        key={`${slot.pueblo.id}-${slot.period}`}
        period={slot.period}
        tempC={match.tempC}
        weatherCode={match.weatherCode}
        pueblo={slot.pueblo}
        periodLabel={periodLabel}
      />
    );
  }).filter(Boolean);

  if (rendered.length === 0) return null;

  return <div className="flex flex-wrap gap-2">{rendered}</div>;
}
