"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sun, CloudSun, Cloud, Cloudy, CloudFog,
  CloudDrizzle, CloudRain, CloudSnow, CloudLightning,
} from "lucide-react";
import { getComunidadFlagSrc } from "@/lib/flags";
import { SortBar } from "./SortBar";

type MeteoAlerta = {
  kind: string;
  title: string | null;
  detail: string | null;
  validUntil?: string | null;
  createdAt?: string | null;
  windowStart?: string | null;
  windowEnd?: string | null;
};

type MeteoItem = {
  pueblo: {
    id: number;
    slug: string;
    nombre: string;
    provincia: string | null;
    comunidad: string | null;
    lat: number | null;
    lng: number | null;
  };
  meteo: {
    timezone: string;
    generatedAt: string;
    current: {
      time: string;
      temperatureC: number | null;
      windKph: number | null;
      windDirDeg: number | null;
      weatherCode: number | null;
    };
    daily: Array<{
      date: string;
      tMaxC: number | null;
      tMinC: number | null;
      precipitationMm: number | null;
      precipProbPct: number | null;
      windMaxKph: number | null;
      weatherCode: number | null;
      sunrise: string | null;
      sunset: string | null;
    }>;
  };
  acumulados?: {
    lluviaHoyMm?: number | null;
    nieveHoyCm?: number | null;
    lluvia24hMm?: number | null;
    nieve24hCm?: number | null;
  } | null;
  airQuality?: {
    europeanAqi: number | null;
    pm10: number | null;
    pm25: number | null;
  } | null;
  alertas?: MeteoAlerta[] | null;
};

type SortMode = "temp_asc" | "temp_desc" | "alpha" | "rain_desc" | "wind_desc" | "aqi_asc";

function n(v: number | null | undefined, digits = 0) {
  if (v === null || v === undefined || Number.isNaN(v)) return null;
  return v.toFixed(digits);
}

type WIconCfg = { Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>; cls: string };

function getWeatherIconCfg(code: number | null): WIconCfg {
  if (code === null || code === 0) return { Icon: Sun, cls: "text-amber-500" };
  if (code === 1) return { Icon: CloudSun, cls: "text-stone-400" };
  if ([2, 3].includes(code)) return { Icon: Cloudy, cls: "text-stone-400" };
  if ([45, 48].includes(code)) return { Icon: CloudFog, cls: "text-stone-400" };
  if ([51, 53, 55, 56, 57].includes(code)) return { Icon: CloudDrizzle, cls: "text-slate-400" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { Icon: CloudRain, cls: "text-slate-500" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { Icon: CloudSnow, cls: "text-sky-400" };
  if ([95, 96, 99].includes(code)) return { Icon: CloudLightning, cls: "text-violet-500" };
  return { Icon: Cloud, cls: "text-stone-400" };
}

function sortItems(items: MeteoItem[], mode: SortMode): MeteoItem[] {
  const arr = [...items];
  switch (mode) {
    case "temp_asc": return arr.sort((a, b) => (a.meteo.current.temperatureC ?? 9999) - (b.meteo.current.temperatureC ?? 9999));
    case "temp_desc": return arr.sort((a, b) => (b.meteo.current.temperatureC ?? -9999) - (a.meteo.current.temperatureC ?? -9999));
    case "alpha": return arr.sort((a, b) => a.pueblo.nombre.localeCompare(b.pueblo.nombre, "es"));
    case "rain_desc": return arr.sort((a, b) => {
      const ra = a.acumulados?.lluvia24hMm ?? 0;
      const rb = b.acumulados?.lluvia24hMm ?? 0;
      if (rb !== ra) return rb - ra;
      return a.pueblo.nombre.localeCompare(b.pueblo.nombre, "es");
    });
    case "wind_desc": return arr.sort((a, b) => (b.meteo.current.windKph ?? 0) - (a.meteo.current.windKph ?? 0));
    case "aqi_asc": return arr.sort((a, b) => (a.airQuality?.europeanAqi ?? 9999) - (b.airQuality?.europeanAqi ?? 9999));
  }
}

interface Labels {
  villagesCount: string;
  mm24h: string;
  snowCm24h: string;
  windKph: string;
  rainProbPct: string;
  aqiLabel: string;
  aqiGood: string;
  aqiFair: string;
  aqiModerate: string;
  aqiPoor: string;
  aqiVeryPoor: string;
  aqiExtreme: string;
  alertSnow: string;
  alertRain: string;
  alertWind: string;
  alertFrost: string;
  alertHeat: string;
  today: string;
  tomorrow: string;
  yesterday: string;
  labelFrom: string;
  labelUntil: string;
  weatherClear: string;
  weatherCloudy: string;
  weatherFog: string;
  weatherDrizzle: string;
  weatherRain: string;
  weatherSnow: string;
  weatherShowers: string;
  weatherStorm: string;
  weatherGeneric: string;
  sortLabels: Record<SortMode, string>;
  loading: string;
  error: string;
}

export function MeteoList({ labels, locale }: { labels: Labels; locale: string }) {
  const [items, setItems] = useState<MeteoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("temp_asc");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await fetch("/api/meteo/pueblos");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function getWeatherText(code: number | null): string {
    if (code === null) return "—";
    if (code === 0) return labels.weatherClear;
    if ([1, 2, 3].includes(code)) return labels.weatherCloudy;
    if ([45, 48].includes(code)) return labels.weatherFog;
    if ([51, 53, 55, 56, 57].includes(code)) return labels.weatherDrizzle;
    if ([61, 63, 65, 66, 67].includes(code)) return labels.weatherRain;
    if ([71, 73, 75, 77].includes(code)) return labels.weatherSnow;
    if ([80, 81, 82].includes(code)) return labels.weatherShowers;
    if ([95, 96, 99].includes(code)) return labels.weatherStorm;
    return labels.weatherGeneric;
  }

  function getAqiInfo(aqi: number | null): { label: string; cls: string } {
    if (aqi === null) return { label: "—", cls: "bg-gray-100 text-gray-500" };
    if (aqi <= 20) return { label: labels.aqiGood, cls: "bg-green-100 text-green-800" };
    if (aqi <= 40) return { label: labels.aqiFair, cls: "bg-lime-100 text-lime-800" };
    if (aqi <= 60) return { label: labels.aqiModerate, cls: "bg-yellow-100 text-yellow-800" };
    if (aqi <= 80) return { label: labels.aqiPoor, cls: "bg-orange-100 text-orange-800" };
    if (aqi <= 100) return { label: labels.aqiVeryPoor, cls: "bg-red-100 text-red-800" };
    return { label: labels.aqiExtreme, cls: "bg-red-200 text-red-900" };
  }

  function getAlertLabel(kind: string): string {
    const map: Record<string, string> = {
      SNOW: labels.alertSnow, RAIN: labels.alertRain, WIND: labels.alertWind,
      FROST: labels.alertFrost, HEAT: labels.alertHeat,
    };
    return map[kind] ?? kind;
  }

  function formatTime(isoTime: string | null): string {
    if (!isoTime) return "—";
    try {
      return new Date(isoTime).toLocaleString(locale, { hour: "2-digit", minute: "2-digit" });
    } catch { return "—"; }
  }

  function formatWindow(start?: string | null, end?: string | null): string | null {
    if (!start && !end) return null;
    try {
      const now = new Date();
      const fmtHM = (d: Date) => d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
      const fmtDM = (d: Date) => d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
      const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
      const labelDay = (d: Date) => {
        if (sameDay(d, now)) return labels.today;
        const tmw = new Date(now); tmw.setDate(now.getDate() + 1);
        if (sameDay(d, tmw)) return labels.tomorrow;
        const ytd = new Date(now); ytd.setDate(now.getDate() - 1);
        if (sameDay(d, ytd)) return labels.yesterday;
        return fmtDM(d);
      };
      const ds = start ? new Date(start) : null;
      const de = end ? new Date(end) : null;
      if (ds && de) return `${labelDay(ds)} ${fmtHM(ds)} → ${labelDay(de)} ${fmtHM(de)}`;
      if (ds) return `${labels.labelFrom} ${labelDay(ds)} ${fmtHM(ds)}`;
      if (de) return `${labels.labelUntil} ${labelDay(de)} ${fmtHM(de)}`;
    } catch { return null; }
    return null;
  }

  const sorted = sortItems(items, sortMode);

  if (loading) {
    return (
      <div className="mt-6 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-[#efe2d8] dark:bg-neutral-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center">
        <p className="text-red-700">{labels.error}</p>
        <button onClick={load} className="mt-3 text-sm font-medium text-primary hover:underline">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <>
      <p className="mt-2 text-neutral-600">
        {labels.villagesCount.replace("{count}", String(sorted.length))}
      </p>

      <SortBar
        currentSort={sortMode}
        labels={labels.sortLabels}
        onSortChange={setSortMode}
      />

      <div className="mt-6 space-y-2">
        {sorted.map((it) => {
          const c = it.meteo.current;
          const d0 = it.meteo.daily?.[0];
          const alertas = it.alertas ?? [];
          const flagSrc = getComunidadFlagSrc(it.pueblo.comunidad);
          const lluvia24h = it.acumulados?.lluvia24hMm ?? it.acumulados?.lluviaHoyMm ?? 0;
          const nieve24h = it.acumulados?.nieve24hCm ?? it.acumulados?.nieveHoyCm ?? 0;
          const aqi = it.airQuality?.europeanAqi ?? null;
          const aqiInfo = getAqiInfo(aqi);

          return (
            <div
              key={it.pueblo.id}
              className="flex flex-wrap items-start gap-4 px-4 py-3 border border-[#e2d5cb] rounded-lg hover:bg-[#e8d9cd] transition bg-[#efe2d8] dark:bg-neutral-800 dark:border-neutral-700 dark:hover:bg-neutral-700"
            >
              <div className="flex-shrink-0 w-20 text-center">
                <div className="text-3xl font-bold leading-none">
                  {c.temperatureC === null ? "—" : `${n(c.temperatureC, 0)}°`}
                </div>
                {d0 && (d0.tMaxC !== null || d0.tMinC !== null) && (
                  <div className="text-xs text-neutral-500 mt-1">
                    {d0.tMaxC !== null && <span className="text-red-500">↑{n(d0.tMaxC, 0)}°</span>}
                    {d0.tMaxC !== null && d0.tMinC !== null && " "}
                    {d0.tMinC !== null && <span className="text-blue-500">↓{n(d0.tMinC, 0)}°</span>}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 pt-0.5" title={getWeatherText(c.weatherCode)}>
                {(() => { const { Icon, cls } = getWeatherIconCfg(c.weatherCode); return <Icon size={28} className={cls} strokeWidth={1.5} />; })()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/pueblos/${it.pueblo.slug}`} className="text-lg font-semibold hover:underline">
                    {it.pueblo.nombre}
                  </Link>
                  <div className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                    {flagSrc && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={flagSrc} alt={`Bandera de ${it.pueblo.comunidad}`} className="h-4 w-6 rounded-sm object-cover" />
                    )}
                    <span>{it.pueblo.provincia} · {it.pueblo.comunidad}</span>
                  </div>
                </div>

                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {lluvia24h != null && (
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${lluvia24h === 0 ? "bg-[#efe2d8]/50 text-[#a09490] border-[#e2d5cb] dark:bg-neutral-700/50 dark:text-neutral-400 dark:border-neutral-600" : "bg-[#efe2d8] text-[#60524d] border-[#e2d5cb] dark:bg-neutral-700 dark:text-neutral-300 dark:border-neutral-600"}`}>
                      <CloudRain size={11} className={lluvia24h === 0 ? "text-stone-300" : "text-slate-500"} strokeWidth={1.5} />
                      {n(lluvia24h, 1)} {labels.mm24h}
                    </span>
                  )}
                  {nieve24h > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#efe2d8] text-[#60524d] border border-[#e2d5cb] dark:bg-neutral-700 dark:text-neutral-300 dark:border-neutral-600">
                      <CloudSnow size={11} className="text-sky-400" strokeWidth={1.5} />
                      {n(nieve24h, 1)} {labels.snowCm24h}
                    </span>
                  )}
                  {c.windKph !== null && c.windKph > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#efe2d8] text-[#60524d] border border-[#e2d5cb] dark:bg-neutral-700 dark:text-neutral-300 dark:border-neutral-600">
                      <CloudFog size={11} className="text-stone-400" strokeWidth={1.5} />
                      {n(c.windKph, 0)} {labels.windKph}
                    </span>
                  )}
                  {d0?.precipProbPct != null && d0.precipProbPct > 10 && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#efe2d8] text-[#60524d] border border-[#e2d5cb] dark:bg-neutral-700 dark:text-neutral-300 dark:border-neutral-600">
                      <CloudDrizzle size={11} className="text-slate-400" strokeWidth={1.5} />
                      {n(d0.precipProbPct, 0)}{labels.rainProbPct}
                    </span>
                  )}
                  {aqi !== null && (
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${aqiInfo.cls}`}>
                      🍃 {labels.aqiLabel}: {aqiInfo.label} ({aqi})
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-shrink-0 text-right text-sm w-full min-w-0 sm:w-auto sm:min-w-[110px]">
                <div className="text-[#60524d] text-sm dark:text-neutral-400">{getWeatherText(c.weatherCode)}</div>
                <div className="text-[#a09490] text-xs mt-0.5 dark:text-neutral-500">{formatTime(c.time)}</div>
                {alertas.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {alertas.map((a, idx) => {
                      const lbl = getAlertLabel(a.kind);
                      const textRaw = (a.title ?? a.detail ?? lbl).trim();
                      const main = textRaw.toLowerCase().startsWith(lbl.toLowerCase()) ? textRaw : `${lbl}: ${textRaw}`;
                      const window = formatWindow(a.windowStart, a.windowEnd);
                      return (
                        <div key={`${a.kind}-${idx}`} className="leading-tight text-right">
                          <span className="text-red-700 font-semibold text-xs leading-tight">
                            {main}
                            {window && <span className="text-red-600 font-normal text-xs ml-1">({window})</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
