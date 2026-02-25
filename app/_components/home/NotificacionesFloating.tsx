"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { homeConfig } from "./home.config";

type TabKey = (typeof homeConfig.notificaciones.tabs)[number]["key"];

type Notificacion = {
  id: string | number;
  titulo: string;
  tipo: string; // "NOTICIA" | "EVENTO" | "ALERTA" | "ALERTA_PUEBLO" | "SEMAFORO"
  texto?: string;
  contenido?: string; // cuerpo traducido del backend
  fecha: string; // ISO
  pueblo?: {
    id: number;
    nombre: string;
    slug: string;
  } | null;
  estado?: string | null;
  motivoPublico?: string | null;
};

// Título del item traducido (semáforo usa i18n; el resto usa titulo/texto del backend o fallback)
function getHomeItemTitle(
  item: Notificacion,
  tNotif: (key: string, values?: Record<string, string>) => string
): string {
  if (item.tipo === "SEMAFORO") {
    const puebloNombre = item.pueblo?.nombre ?? "Pueblo";
    if (item.estado) {
      const estado = item.estado.toUpperCase();
      const statusKey =
        estado === "VERDE"
          ? "semaforoStatusGreen"
          : estado === "AMARILLO"
            ? "semaforoStatusYellow"
            : estado === "ROJO"
              ? "semaforoStatusRed"
              : null;
      if (statusKey) {
        return tNotif("semaforoPuebloIs", {
          pueblo: puebloNombre,
          status: tNotif(statusKey),
        });
      }
    }
    return tNotif("semaforoPuebloUpdated", { pueblo: puebloNombre });
  }
  if (item.tipo === "ALERTA" || item.tipo === "ALERTA_PUEBLO") {
    return (item.titulo || item.texto) || tNotif("alertFallback");
  }
  return (item.titulo || item.texto) || tNotif("actualidadFallback");
}

export function NotificacionesFloating() {
  const locale = useLocale();
  const tHome = useTranslations("home");
  const tNotif = useTranslations("notifications");
  const [active, setActive] = useState<TabKey>("NACIONAL");
  const [items, setItems] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  function formatDate(iso?: string) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(locale, { day: "2-digit", month: "short" });
  }

  const tabLabels: Record<TabKey, string> = useMemo(
    () => ({
      NACIONAL: tHome("tabNews"),
      SEMAFORO: tHome("tabSemaforos"),
      ALERTA: tHome("tabAlertas"),
      METEO: tHome("meteo"),
    }),
    [tHome]
  );

  const maxItems = 2; // Máximo 2 items visibles

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const lang = encodeURIComponent(locale);

        // Noticias y eventos: solo de la asociación (puebloId=null)
        // Alertas, semáforos, meteo: del feed general (incluyen pueblos)
        const [resNoticias, resEventos, resFeed] = await Promise.all([
          fetch(`/api/public/noticias?limit=5&lang=${lang}`, { cache: "no-store" }),
          fetch(`/api/public/eventos?limit=5&lang=${lang}`, { cache: "no-store" }),
          fetch(`/api/public/notificaciones/feed?limit=10&tipos=ALERTA,ALERTA_PUEBLO,SEMAFORO,METEO&lang=${lang}`, {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

        const noticias: any[] = resNoticias.ok ? await resNoticias.json().catch(() => []) : [];
        const eventos: any[] = resEventos.ok ? await resEventos.json().catch(() => []) : [];
        const feedData = resFeed.ok ? await resFeed.json().catch(() => []) : [];
        const feedItems: any[] = Array.isArray(feedData) ? feedData : (feedData?.items ?? []);

        const mapItem = (item: any, tipo: string): Notificacion & { slug?: string; contenidoSlug?: string } => ({
          id: item.id ?? Math.random(),
          titulo: item.titulo ?? "",
          tipo,
          texto: item.contenido ?? item.resumen ?? "",
          contenido: item.contenido ?? item.resumen ?? null,
          fecha: item.fechaInicio ?? item.fecha ?? item.createdAt ?? new Date().toISOString(),
          pueblo: item.pueblo ?? null,
          estado: item.estado ?? null,
          motivoPublico: item.motivoPublico ?? null,
          slug: item.slug ?? null,
          contenidoSlug: item.contenidoSlug ?? null,
        });

        const mapped: Notificacion[] = [
          ...noticias.map((i: any) => mapItem(i, "NOTICIA")),
          ...eventos.map((i: any) => mapItem(i, "EVENTO")),
          ...feedItems.map((i: any) => mapItem(i, i.tipo ?? "ALERTA")),
        ];

        if (!cancelled) setItems(mapped);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const filtered = useMemo(() => {
    // Mapear tabs a tipos de notificación
    const tipoMap: Record<TabKey, string[]> = {
      NACIONAL: ["NOTICIA", "EVENTO"],
      SEMAFORO: ["SEMAFORO"],
      ALERTA: ["ALERTA", "ALERTA_PUEBLO"],
      METEO: ["METEO"],
    };
    
    const tiposPermitidos = tipoMap[active] ?? [];
    
    return items.filter((n) => {
      const t = (n.tipo || "").toUpperCase();
      return tiposPermitidos.includes(t);
    });
  }, [items, active]);

  return (
    <div className="relative z-50 pointer-events-auto w-[calc(100%-2rem)] rounded-2xl border border-black/10 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.10)]">
      <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_180px]">
        {/* Cuerpo */}
        <div className="px-6 py-4 md:px-8 md:py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/notificaciones"
                className="text-base font-semibold hover:underline"
              >
                {tHome("notifCenterTitle")}
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {homeConfig.notificaciones.tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active === t.key
                      ? "bg-black text-white"
                      : "bg-black/5 text-black hover:bg-black/10"
                  }`}
                >
                  {tabLabels[t.key]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            {loading ? (
              <div className="text-sm text-gray-500">{tNotif("loading")}</div>
            ) : items.length === 0 ? (
              <div className="text-sm text-gray-500">
                {tNotif("noNotificationsNow")}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-gray-500">
                {active === "METEO"
                  ? tNotif("noMeteoAlertsNow")
                  : tNotif("noItemsNow", { type: tabLabels[active].toLowerCase() })}
              </div>
            ) : (
              <ul className="space-y-2">
                {filtered.slice(0, maxItems).map((n) => {
                  const date = formatDate(n.fecha);
                  
                  let href: string;
                  if ((n as any).contenidoSlug) {
                    href = `/c/${(n as any).contenidoSlug}`;
                  } else if ((n as any).slug && (n.tipo === "NOTICIA" || n.tipo === "EVENTO")) {
                    href = `/${n.tipo === "NOTICIA" ? "noticias" : "eventos"}/${(n as any).slug}`;
                  } else if ((n as any).url || (n as any).href) {
                    href = (n as any).url || (n as any).href;
                  } else if (n.tipo === "SEMAFORO" && n.pueblo?.slug) {
                    href = `/pueblos/${n.pueblo.slug}`;
                  } else {
                    href = homeConfig.notificaciones.allHref;
                  }

                  const titulo = getHomeItemTitle(n, tNotif);
                  // Para semáforos usar contenido (traducido); resto motivoPublico
                  const motivo = n.tipo === "SEMAFORO"
                    ? (n.contenido ?? n.motivoPublico)?.trim() || null
                    : (n.motivoPublico?.trim() || null);

                  return (
                    <li key={n.id} className="flex items-start gap-3">
                      <div className="w-14 shrink-0 text-xs text-gray-500 pt-0.5">
                        {date}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={href}
                          className="block text-sm hover:underline"
                        >
                          {titulo}
                        </Link>
                        {motivo && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {tNotif("motivo")} {motivo}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-3">
            <Link
              href={homeConfig.notificaciones.allHref}
              className="text-sm font-medium hover:underline"
            >
              {tNotif("viewAll")} →
            </Link>
          </div>
        </div>

        {/* Botón lateral premium */}
        <div className="flex items-stretch">
          <Link
            href={active === "METEO" ? "/meteo" : homeConfig.notificaciones.allHref}
            className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 h-14 md:h-16"
          >
            {tNotif("open")}
          </Link>
        </div>
      </div>
    </div>
  );
}

