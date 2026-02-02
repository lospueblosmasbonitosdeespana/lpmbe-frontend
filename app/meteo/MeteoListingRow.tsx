"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type MeteoAlerta = {
  kind: string;
  title: string | null;
  detail: string | null;
  windowStart?: string | null;
  windowEnd?: string | null;
};

export type MeteoRowData = {
  pueblo: {
    id: number;
    slug: string;
    nombre: string;
    provincia: string | null;
    comunidad: string | null;
  };
  meteo: {
    current: {
      temperatureC: number | null;
      windKph: number | null;
      weatherCode: number | null;
      time: string | null;
    };
  };
  acumulados?: {
    lluviaHoyMm?: number | null;
    nieveHoyCm?: number | null;
  } | null;
  alertas?: MeteoAlerta[] | null;
};

/* ----- WEATHER ICONS SVG ----- */
type WeatherCondition = "sunny" | "cloudy" | "partly-cloudy" | "rain" | "snow" | "storm" | "fog";

function mapWeatherCodeToCondition(code: number | null): WeatherCondition {
  if (code === null) return "cloudy";
  if (code === 0) return "sunny";
  if ([1, 2].includes(code)) return "partly-cloudy";
  if ([3].includes(code)) return "cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "cloudy";
}

function WeatherIcon({ condition, className }: { condition: WeatherCondition; className?: string }) {
  const baseClass = cn("h-6 w-6 text-muted-foreground", className);

  switch (condition) {
    case "sunny":
      return (
        <svg className={cn(baseClass, "text-amber-500")} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      );
    case "cloudy":
      return (
        <svg className={baseClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
      );
    case "partly-cloudy":
      return (
        <svg className={baseClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2v2" className="text-amber-500" stroke="currentColor" />
          <path d="M4.93 4.93l1.41 1.41" className="text-amber-500" stroke="currentColor" />
          <path d="M20 12h2" className="text-amber-500" stroke="currentColor" />
          <path d="M19.07 4.93l-1.41 1.41" className="text-amber-500" stroke="currentColor" />
          <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128" className="text-amber-500" stroke="currentColor" />
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
      );
    case "rain":
      return (
        <svg className={cn(baseClass, "text-blue-500")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17.5 13H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" className="text-muted-foreground" stroke="currentColor" />
          <path d="M8 19v2M12 19v2M16 19v2" strokeLinecap="round" />
        </svg>
      );
    case "snow":
      return (
        <svg className={cn(baseClass, "text-sky-400")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17.5 13H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" className="text-muted-foreground" stroke="currentColor" />
          <path d="M8 18l.5.5M12 18l.5.5M16 18l.5.5M9 21l.5.5M13 21l.5.5" strokeLinecap="round" />
        </svg>
      );
    case "storm":
      return (
        <svg className={baseClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17.5 13H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          <path d="M13 13l-2 4h3l-2 4" className="text-amber-500" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "fog":
      return (
        <svg className={baseClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 14h16M4 18h12M6 10h14" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg className={baseClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
      );
  }
}

function n(v: number | null | undefined, d = 0) {
  if (v == null || Number.isNaN(v)) return null;
  return v.toFixed(d);
}

function getWeatherText(code: number | null): string {
  if (code === null) return "—";
  const texts: Record<number, string> = {
    0: "Despejado",
    1: "Nuboso",
    2: "Nuboso",
    3: "Nuboso",
    45: "Niebla",
    48: "Niebla",
    51: "Llovizna",
    53: "Llovizna",
    55: "Llovizna",
    61: "Lluvia",
    63: "Lluvia",
    65: "Lluvia",
    71: "Nieve",
    73: "Nieve",
    75: "Nieve",
    80: "Chubascos",
    81: "Chubascos",
    82: "Chubascos",
    95: "Tormenta",
    96: "Tormenta",
    99: "Tormenta",
  };
  return texts[code] ?? "Tiempo";
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function formatWindow(start: string | null | undefined, end: string | null | undefined): string | null {
  if (!start && !end) return null;
  try {
    const now = new Date();
    const fmtHM = (d: Date) => d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const labelDay = (d: Date) => {
      if (sameDay(d, now)) return "Hoy";
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      if (sameDay(d, tomorrow)) return "Mañana";
      return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
    };
    const ds = start ? new Date(start) : null;
    const de = end ? new Date(end) : null;
    if (ds && de) return `${labelDay(ds)} ${fmtHM(ds)} → ${labelDay(de)} ${fmtHM(de)}`;
    return ds ? `desde ${labelDay(ds)} ${fmtHM(ds)}` : null;
  } catch {
    return null;
  }
}

const ALERTA_LABEL: Record<string, string> = {
  SNOW: "Nieve",
  RAIN: "Lluvia",
  WIND: "Viento",
  FROST: "Helada",
  HEAT: "Calor",
};

function AlertBadge({ alert }: { alert: MeteoAlerta }) {
  const label = ALERTA_LABEL[alert.kind] ?? alert.kind;
  const text = (alert.title ?? alert.detail ?? label).trim();
  const main = text.toLowerCase().startsWith(label.toLowerCase()) ? text : `${label}: ${text}`;
  const win = formatWindow(alert.windowStart, alert.windowEnd);

  const colorClasses = {
    rain: "text-primary",
    snow: "text-primary",
    frost: "text-primary",
    heat: "text-orange-600",
    wind: "text-amber-600",
  };
  const colorClass = colorClasses[alert.kind.toLowerCase() as keyof typeof colorClasses] || "text-primary";

  return (
    <div className={cn("text-right text-xs leading-tight", colorClass)}>
      <span className="font-medium">{main}</span>
      {win && <span className="ml-1 text-muted-foreground">({win})</span>}
    </div>
  );
}

export function MeteoListingRow({
  data,
  flagSrc,
  className,
}: {
  data: MeteoRowData;
  flagSrc?: string | null;
  className?: string;
}) {
  const { pueblo, meteo, acumulados, alertas } = data;
  const c = meteo.current;
  const lluvia = acumulados?.lluviaHoyMm ?? 0;
  const nieve = acumulados?.nieveHoyCm ?? 0;
  const condition = mapWeatherCodeToCondition(c.weatherCode);

  const tempDisplay = c.temperatureC === null ? "—" : `${n(c.temperatureC, 0)}°`;

  return (
    <Link
      href={`/pueblos/${pueblo.slug}`}
      className={cn(
        "group flex items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-muted/50 sm:gap-4 sm:px-6",
        className
      )}
    >
      {/* Temperature */}
      <div className="flex w-12 shrink-0 items-center justify-center sm:w-14">
        <span
          className={cn(
            "font-serif text-2xl font-semibold tabular-nums sm:text-3xl",
            c.temperatureC !== null && c.temperatureC <= 0 && "text-sky-600",
            c.temperatureC !== null && c.temperatureC > 0 && c.temperatureC <= 10 && "text-foreground",
            c.temperatureC !== null && c.temperatureC > 10 && c.temperatureC <= 25 && "text-amber-600",
            c.temperatureC !== null && c.temperatureC > 25 && "text-red-600"
          )}
        >
          {tempDisplay}
        </span>
      </div>

      {/* Weather Icon SVG */}
      <div className="shrink-0">
        <WeatherIcon condition={condition} />
      </div>

      {/* Village Info + Weather Stats */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-serif font-semibold text-foreground group-hover:text-primary sm:text-lg">
            {pueblo.nombre}
          </span>
          {flagSrc && (
            <img
              src={flagSrc}
              alt={`Bandera de ${pueblo.comunidad}`}
              className="inline h-3 w-4 rounded-sm object-cover"
            />
          )}
          <span className="text-xs text-muted-foreground sm:text-sm">
            {pueblo.provincia} · {pueblo.comunidad}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground sm:text-sm">
          {lluvia > 0 && (
            <span>
              Lluvia hoy: <strong className="font-medium text-foreground">{n(lluvia, 0)} mm</strong>
            </span>
          )}
          {nieve > 0 && (
            <span>
              Nieve hoy: <strong className="font-medium text-foreground">{n(nieve, 1)} cm</strong>
            </span>
          )}
          {c.windKph !== null && c.windKph > 0 && (
            <span>
              Viento: <strong className="font-medium text-foreground">{n(c.windKph, 0)} km/h</strong>
            </span>
          )}
        </div>
      </div>

      {/* Alerts & Current Condition */}
      <div className="hidden shrink-0 flex-col items-end gap-0.5 sm:flex">
        {alertas && alertas.length > 0 ? (
          alertas.map((alert, index) => <AlertBadge key={index} alert={alert} />)
        ) : (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">{getWeatherText(c.weatherCode)}</div>
            <div className="text-xs text-muted-foreground/70">{formatTime(c.time)}</div>
          </div>
        )}
      </div>
    </Link>
  );
}
