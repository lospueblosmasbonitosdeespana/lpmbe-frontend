'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Sun, CloudSun, Cloud, Cloudy, CloudFog, CloudDrizzle,
  CloudRain, CloudSnow, CloudLightning, Droplets,
} from 'lucide-react';

type DailyEntry = {
  date: string;
  tMaxC: number | null;
  tMinC: number | null;
  precipProbPct: number | null;
  weatherCode: number | null;
};

type MeteoResponse = {
  current: { temperatureC: number | null; weatherCode: number | null };
  daily: DailyEntry[];
};

type PuebloRef = {
  id: number;
  slug: string;
  nombre: string;
};

export type MeteoSlot = {
  pueblo: PuebloRef;
  label: 'morning' | 'afternoon' | 'allday';
};

function getWmoIcon(code: number | null) {
  if (code === null || code === 0) return { Icon: Sun, cls: 'text-amber-500' };
  if (code === 1) return { Icon: CloudSun, cls: 'text-stone-400' };
  if ([2, 3].includes(code)) return { Icon: Cloudy, cls: 'text-stone-500' };
  if ([45, 48].includes(code)) return { Icon: CloudFog, cls: 'text-stone-400' };
  if ([51, 53, 55, 56, 57].includes(code)) return { Icon: CloudDrizzle, cls: 'text-slate-400' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { Icon: CloudRain, cls: 'text-blue-500' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { Icon: CloudSnow, cls: 'text-sky-400' };
  if ([95, 96, 99].includes(code)) return { Icon: CloudLightning, cls: 'text-violet-500' };
  return { Icon: Cloud, cls: 'text-stone-500' };
}

function MeteoChip({
  day,
  slot,
  t,
}: {
  day: DailyEntry;
  slot: MeteoSlot;
  t: ReturnType<typeof useTranslations>;
}) {
  const { Icon, cls } = getWmoIcon(day.weatherCode);
  const slotLabel =
    slot.label === 'morning' ? t('morning') :
    slot.label === 'afternoon' ? t('afternoon') : null;

  return (
    <a
      href={`/pueblos/${slot.pueblo.slug}/meteo`}
      className="group flex items-center gap-2.5 rounded-xl bg-amber-50/80 px-3.5 py-2.5 ring-1 ring-amber-200/70 shadow-sm transition hover:bg-amber-100 hover:ring-amber-400 hover:shadow-md"
      title={`${slot.pueblo.nombre} — ${t('fullForecast')}`}
    >
      <Icon size={24} className={cls} strokeWidth={1.5} />
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-bold text-stone-900">
          {day.tMaxC != null ? `${Math.round(day.tMaxC)}°` : '—'}
          <span className="font-normal text-stone-500">
            /{day.tMinC != null ? `${Math.round(day.tMinC)}°` : '—'}
          </span>
        </span>
        <span className="text-[11px] text-stone-600 group-hover:text-amber-800">
          {slotLabel ? `${slotLabel} · ` : ''}{slot.pueblo.nombre}
        </span>
      </div>
      {day.precipProbPct != null && day.precipProbPct > 15 && (
        <span className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-600">
          <Droplets className="h-3 w-3" />
          {day.precipProbPct}%
        </span>
      )}
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
  const [dailyByPueblo, setDailyByPueblo] = useState<Map<number, DailyEntry | null>>(new Map());
  const [loaded, setLoaded] = useState(false);

  const uniquePuebloIds = [...new Set(slots.map((s) => s.pueblo.id))];

  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      const results = new Map<number, DailyEntry | null>();
      await Promise.all(
        uniquePuebloIds.map(async (pid) => {
          try {
            const res = await fetch(`/api/meteo/pueblo-public/${pid}`, { cache: 'no-store' });
            if (!res.ok) { results.set(pid, null); return; }
            const data: MeteoResponse = await res.json();
            const match = data.daily?.find((d) => d.date === targetDate) ?? null;
            results.set(pid, match);
          } catch {
            results.set(pid, null);
          }
        }),
      );
      if (!cancelled) {
        setDailyByPueblo(results);
        setLoaded(true);
      }
    }
    fetchAll();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate, uniquePuebloIds.join(',')]);

  if (!loaded) return null;

  const validSlots = slots.filter((s) => dailyByPueblo.get(s.pueblo.id) != null);
  if (validSlots.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {validSlots.map((slot) => {
        const day = dailyByPueblo.get(slot.pueblo.id)!;
        return (
          <MeteoChip key={`${slot.pueblo.id}-${slot.label}`} day={day} slot={slot} t={t} />
        );
      })}
    </div>
  );
}
