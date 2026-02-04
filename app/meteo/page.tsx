import Link from "next/link";
import { headers } from "next/headers";
import { getComunidadFlagSrc } from "@/lib/flags";

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
  } | null;
  alertas?: MeteoAlerta[] | null;
};

function n(v: number | null | undefined, digits = 0) {
  if (v === null || v === undefined || Number.isNaN(v)) return null;
  return v.toFixed(digits);
}

// Mapping weatherCode -> emoji
function getWeatherIcon(code: number | null): string {
  if (code === null) return "—";
  if (code === 0) return "☀️"; // Despejado
  if ([1, 2, 3].includes(code)) return "☁️"; // Nuboso
  if ([45, 48].includes(code)) return "🌫️"; // Niebla
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️"; // Lluvia
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️"; // Nieve
  if ([95, 96, 99].includes(code)) return "⛈️"; // Tormenta
  return "🌤️"; // Default
}

// Mapping weatherCode -> texto
function getWeatherText(code: number | null): string {
  if (code === null) return "—";
  if (code === 0) return "Despejado";
  if ([1, 2, 3].includes(code)) return "Nuboso";
  if ([45, 48].includes(code)) return "Niebla";
  if ([51, 53, 55, 56, 57].includes(code)) return "Llovizna";
  if ([61, 63, 65, 66, 67].includes(code)) return "Lluvia";
  if ([71, 73, 75, 77].includes(code)) return "Nieve";
  if ([80, 81, 82].includes(code)) return "Chubascos";
  if ([95, 96, 99].includes(code)) return "Tormenta";
  return "Tiempo";
}

// Formatear hora
function formatTime(isoTime: string | null): string {
  if (!isoTime) return "—";
  try {
    return new Date(isoTime).toLocaleString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

// Formatear ventana temporal (Hoy 22:00 → Mañana 10:00)
function formatWindow(
  start: string | null | undefined,
  end: string | null | undefined
): string | null {
  if (!start && !end) return null;

  try {
    const now = new Date();

    const fmtHM = (d: Date) =>
      d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

    const fmtDM = (d: Date) =>
      d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    const labelDay = (d: Date) => {
      if (sameDay(d, now)) return "Hoy";
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      if (sameDay(d, tomorrow)) return "Mañana";
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (sameDay(d, yesterday)) return "Ayer";
      return fmtDM(d);
    };

    const ds = start ? new Date(start) : null;
    const de = end ? new Date(end) : null;

    if (ds && de) {
      return `${labelDay(ds)} ${fmtHM(ds)} → ${labelDay(de)} ${fmtHM(de)}`;
    }
    if (ds) return `desde ${labelDay(ds)} ${fmtHM(ds)}`;
    if (de) return `hasta ${labelDay(de)} ${fmtHM(de)}`;
  } catch {
    return null;
  }

  return null;
}

// Componente inline de alerta (rojo, a la derecha)
function AlertInline({
  a,
}: {
  a: { 
    kind: string; 
    title: string | null; 
    detail: string | null;
    windowStart?: string | null;
    windowEnd?: string | null;
  };
}) {
  const label =
    a.kind === "SNOW"
      ? "Nieve"
      : a.kind === "RAIN"
      ? "Lluvia"
      : a.kind === "WIND"
      ? "Viento"
      : a.kind === "FROST"
      ? "Helada"
      : a.kind === "HEAT"
      ? "Calor"
      : a.kind;

  const textRaw = (a.title ?? a.detail ?? label).trim();

  const textLower = textRaw.toLowerCase();
  const labelLower = label.toLowerCase();

  const main =
    textLower.startsWith(labelLower) ? textRaw : `${label}: ${textRaw}`;

  const window = formatWindow(a.windowStart, a.windowEnd);

  // Color más fuerte para HEAT
  const colorClass = a.kind === "HEAT" ? "text-red-800" : "text-red-700";

  return (
    <span className={`${colorClass} font-semibold leading-tight`} title={a.detail ?? ""}>
      {main}
      {window ? (
        <span className="text-red-600 font-normal text-xs ml-1">
          ({window})
        </span>
      ) : null}
    </span>
  );
}

async function getOrigin() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (!host) return "http://localhost:3001";
  return `${proto}://${host}`;
}

export const dynamic = "force-dynamic";

export default async function MeteoPage() {
  const origin = await getOrigin();
  const res = await fetch(`${origin}/api/meteo/pueblos`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Meteo agregada: HTTP ${res.status}`);

  const items: MeteoItem[] = await res.json();

  const sorted = items
    .slice()
    .sort((a, b) => (a.meteo.current.temperatureC ?? 9999) - (b.meteo.current.temperatureC ?? 9999));

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-semibold tracking-tight">Meteo</h1>
      <p className="mt-2 text-neutral-600">
        Ordenado de temperatura más baja a más alta · {sorted.length} pueblos
      </p>

      <div className="mt-6 space-y-2">
        {sorted.map((it) => {
          const c = it.meteo.current;
          const d0 = it.meteo.daily?.[0];
          const alertas = it.alertas ?? [];
          const flagSrc = getComunidadFlagSrc(it.pueblo.comunidad);

          // Usar acumulados si existen, sino calcular fallback
          const lluviaHoy = it.acumulados?.lluviaHoyMm ?? d0?.precipitationMm ?? 0;
          const nieveHoy = it.acumulados?.nieveHoyCm ?? 0;

          return (
            <div
              key={it.pueblo.id}
              className="flex items-center gap-4 px-4 py-3 border rounded-lg hover:bg-gray-50 transition"
            >
              {/* Temperatura grande */}
              <div className="flex-shrink-0 w-20 text-center">
                <div className="text-3xl font-bold">
                  {c.temperatureC === null ? "—" : `${n(c.temperatureC, 0)}°`}
                </div>
              </div>

              {/* Icono estado */}
              <div className="flex-shrink-0 text-3xl" title={getWeatherText(c.weatherCode)}>
                {getWeatherIcon(c.weatherCode)}
              </div>

              {/* Pueblo + Provincia/CCAA */}
              <div className="flex-1 min-w-0">
                {/* Línea 1: Nombre + ubicación */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/pueblos/${it.pueblo.slug}`}
                    className="text-lg font-semibold hover:underline"
                  >
                    {it.pueblo.nombre}
                  </Link>
                  <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                    {flagSrc && (
                      <img
                        src={flagSrc}
                        alt={`Bandera de ${it.pueblo.comunidad}`}
                        className="h-4 w-6 rounded-sm object-cover"
                      />
                    )}
                    <span>
                      {it.pueblo.provincia} · {it.pueblo.comunidad}
                    </span>
                  </div>
                </div>

                {/* Línea 2: Lluvia, viento */}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
                  {/* Lluvia hoy */}
                  {lluviaHoy > 0 && (
                    <span>
                      Lluvia hoy: <strong>{n(lluviaHoy, 0)} mm</strong>
                    </span>
                  )}

                  {/* Nieve hoy */}
                  {nieveHoy > 0 && (
                    <span>
                      Nieve hoy: <strong>{n(nieveHoy, 1)} cm</strong>
                    </span>
                  )}

                  {/* Viento */}
                  {c.windKph !== null && c.windKph > 0 && (
                    <span>
                      Viento: <strong>{n(c.windKph, 0)} km/h</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Estado y tiempo O alertas (derecha) */}
              <div className="flex-shrink-0 text-right text-sm min-w-[320px]">
                {alertas && alertas.length > 0 ? (
                  <div className="space-y-1">
                    {alertas.map((a, idx) => (
                      <div key={`${a.kind}-${idx}`} className="leading-tight">
                        <AlertInline a={a} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="text-neutral-600">{getWeatherText(c.weatherCode)}</div>
                    <div className="text-neutral-500 text-xs">
                      {formatTime(c.time)}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
