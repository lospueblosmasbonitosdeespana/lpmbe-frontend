import Link from "next/link";
import { headers } from "next/headers";
import { Suspense } from "react";
import { getTranslations, getLocale } from "next-intl/server";
import {
  Sun, CloudSun, Cloud, Cloudy, CloudFog,
  CloudDrizzle, CloudRain, CloudSnow, CloudLightning,
} from "lucide-react";
import { getComunidadFlagSrc } from "@/lib/flags";
import { SortBar } from "./SortBar";

type MeteoAlerta = {
  kind: "RAIN" | "SNOW" | "WIND" | "FROST" | "HEAT" | string;
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

async function getOrigin() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) return "http://localhost:3001";
  return `${proto}://${host}`;
}

export const dynamic = "force-dynamic";

export default async function MeteoPage(props: { searchParams: Promise<{ sort?: string }> }) {
  const searchParams = await props.searchParams;
  const sortMode = (searchParams.sort ?? "temp_asc") as SortMode;

  const [t, tPanel, locale] = await Promise.all([
    getTranslations("meteoPage"),
    getTranslations("meteoPanel"),
    getLocale(),
  ]);

  // Helper: weather text from meteoPanel translations (existing keys)
  function getWeatherText(code: number | null): string {
    if (code === null) return "—";
    if (code === 0) return tPanel("clear");
    if ([1, 2, 3].includes(code)) return tPanel("cloudy");
    if ([45, 48].includes(code)) return tPanel("fog");
    if ([51, 53, 55, 56, 57].includes(code)) return tPanel("drizzle");
    if ([61, 63, 65, 66, 67].includes(code)) return tPanel("rain");
    if ([71, 73, 75, 77].includes(code)) return tPanel("snow");
    if ([80, 81, 82].includes(code)) return tPanel("showers");
    if ([95, 96, 99].includes(code)) return tPanel("storm");
    return tPanel("weather");
  }

  function getAqiInfo(aqi: number | null): { label: string; cls: string } {
    if (aqi === null) return { label: "—", cls: "bg-gray-100 text-gray-500" };
    if (aqi <= 20) return { label: t("aqiGood"), cls: "bg-green-100 text-green-800" };
    if (aqi <= 40) return { label: t("aqiFair"), cls: "bg-lime-100 text-lime-800" };
    if (aqi <= 60) return { label: t("aqiModerate"), cls: "bg-yellow-100 text-yellow-800" };
    if (aqi <= 80) return { label: t("aqiPoor"), cls: "bg-orange-100 text-orange-800" };
    if (aqi <= 100) return { label: t("aqiVeryPoor"), cls: "bg-red-100 text-red-800" };
    return { label: t("aqiExtreme"), cls: "bg-red-200 text-red-900" };
  }

  function getAlertLabel(kind: string): string {
    const map: Record<string, string> = {
      SNOW: t("alertSnow"),
      RAIN: t("alertRain"),
      WIND: t("alertWind"),
      FROST: t("alertFrost"),
      HEAT: t("alertHeat"),
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
        if (sameDay(d, now)) return t("today");
        const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
        if (sameDay(d, tomorrow)) return t("tomorrow");
        const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
        if (sameDay(d, yesterday)) return t("yesterday");
        return fmtDM(d);
      };
      const ds = start ? new Date(start) : null;
      const de = end ? new Date(end) : null;
      if (ds && de) return `${labelDay(ds)} ${fmtHM(ds)} → ${labelDay(de)} ${fmtHM(de)}`;
      if (ds) return `${t("labelFrom")} ${labelDay(ds)} ${fmtHM(ds)}`;
      if (de) return `${t("labelUntil")} ${labelDay(de)} ${fmtHM(de)}`;
    } catch { return null; }
    return null;
  }

  // Labels para SortBar (client component)
  const sortLabels: Record<SortMode, string> = {
    temp_asc: t("sortColdest"),
    temp_desc: t("sortHottest"),
    alpha: t("sortAlpha"),
    rain_desc: t("sortRain"),
    wind_desc: t("sortWind"),
    aqi_asc: t("sortAir"),
  };

  const origin = await getOrigin();
  const res = await fetch(`${origin}/api/meteo/pueblos`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Meteo agregada: HTTP ${res.status}`);

  const items: MeteoItem[] = await res.json();
  const sorted = sortItems(items, sortMode);

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-neutral-600">
        {t("villagesCount", { count: sorted.length })}
      </p>

      {/* Controles de orden */}
      <Suspense fallback={null}>
        <SortBar currentSort={sortMode} labels={sortLabels} />
      </Suspense>

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
              className="flex items-start gap-4 px-4 py-3 border border-[#e2d5cb] rounded-lg hover:bg-[#e8d9cd] transition bg-[#efe2d8]"
            >
              {/* Temperatura + máx/mín */}
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

              {/* Icono */}
              <div className="flex-shrink-0 pt-0.5" title={getWeatherText(c.weatherCode)}>
                {(() => { const { Icon, cls } = getWeatherIconCfg(c.weatherCode); return <Icon size={28} className={cls} strokeWidth={1.5} />; })()}
              </div>

              {/* Info central */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/pueblos/${it.pueblo.slug}`} className="text-lg font-semibold hover:underline">
                    {it.pueblo.nombre}
                  </Link>
                  <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                    {flagSrc && (
                      <img src={flagSrc} alt={`Bandera de ${it.pueblo.comunidad}`} className="h-4 w-6 rounded-sm object-cover" />
                    )}
                    <span>{it.pueblo.provincia} · {it.pueblo.comunidad}</span>
                  </div>
                </div>

                {/* Pills: lluvia, nieve, viento, prob precipitación */}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {lluvia24h != null && (
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${lluvia24h === 0 ? "bg-[#efe2d8]/50 text-[#a09490] border-[#e2d5cb]" : "bg-[#efe2d8] text-[#60524d] border-[#e2d5cb]"}`}>
                      <CloudRain size={11} className={lluvia24h === 0 ? "text-stone-300" : "text-slate-500"} strokeWidth={1.5} />
                      {n(lluvia24h, 1)} {t("mm24h")}
                    </span>
                  )}
                  {nieve24h > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#efe2d8] text-[#60524d] border border-[#e2d5cb]">
                      <CloudSnow size={11} className="text-sky-400" strokeWidth={1.5} />
                      {n(nieve24h, 1)} {t("snowCm24h")}
                    </span>
                  )}
                  {c.windKph !== null && c.windKph > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#efe2d8] text-[#60524d] border border-[#e2d5cb]">
                      <CloudFog size={11} className="text-stone-400" strokeWidth={1.5} />
                      {n(c.windKph, 0)} {t("windKph")}
                    </span>
                  )}
                  {d0?.precipProbPct != null && d0.precipProbPct > 10 && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#efe2d8] text-[#60524d] border border-[#e2d5cb]">
                      <CloudDrizzle size={11} className="text-slate-400" strokeWidth={1.5} />
                      {n(d0.precipProbPct, 0)}{t("rainProbPct")}
                    </span>
                  )}
                  {aqi !== null && (
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${aqiInfo.cls}`}>
                      🍃 {t("aqiLabel")}: {aqiInfo.label} ({aqi})
                    </span>
                  )}
                </div>

                {/* Alertas */}
                {alertas.length > 0 && (
                  <div className="mt-1.5 space-y-0.5">
                    {alertas.map((a, idx) => {
                      const label = getAlertLabel(a.kind);
                      const textRaw = (a.title ?? a.detail ?? label).trim();
                      const main = textRaw.toLowerCase().startsWith(label.toLowerCase()) ? textRaw : `${label}: ${textRaw}`;
                      const window = formatWindow(a.windowStart, a.windowEnd);
                      return (
                        <div key={`${a.kind}-${idx}`} className="leading-tight">
                          <span className="text-red-700 font-semibold leading-tight">
                            {main}
                            {window && <span className="text-red-600 font-normal text-xs ml-1">({window})</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Derecha: estado + hora */}
              {alertas.length === 0 && (
                <div className="flex-shrink-0 text-right text-sm min-w-[90px]">
                  <div className="text-[#60524d] text-sm">{getWeatherText(c.weatherCode)}</div>
                  <div className="text-[#a09490] text-xs mt-0.5">{formatTime(c.time)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
