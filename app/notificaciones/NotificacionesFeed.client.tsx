"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

type FeedItem = {
  id: string | number;
  tipo: "NOTICIA" | "EVENTO" | "ALERTA" | "ALERTA_PUEBLO" | "SEMAFORO" | "METEO";
  titulo: string;
  texto: string;
  fecha: string;
  slug?: string | null;
  contenidoSlug?: string | null;
  contenidoUrl?: string | null;
  pueblo?: {
    id: number;
    nombre: string;
    slug: string;
  } | null;
  estado?: string | null;
  motivoPublico?: string | null;
};

type FilterType = "TODAS" | "NOTICIA" | "ALERTA" | "SEMAFORO" | "EVENTO";

// Helper seguro para convertir fecha a milisegundos
function toMs(value: string | null | undefined): number {
  if (!value) return 0;
  try {
    const d = new Date(value);
    const ms = d.getTime();
    return isNaN(ms) ? 0 : ms;
  } catch {
    return 0;
  }
}

// Heurística de color para semáforos
// El estado debe venir del backend como "VERDE" | "AMARILLO" | "ROJO"
// NO inventar colores si el backend no lo manda
function getSemaforoColor(item: FeedItem): string | null {
  // Solo usar item.estado si viene del backend
  if (item.estado) {
    const estado = item.estado.toUpperCase();
    if (estado === "VERDE") return "verde";
    if (estado === "AMARILLO") return "amarillo";
    if (estado === "ROJO") return "rojo";
  }

  // Si no viene estado, NO inventar colores
  return null;
}

// Generar título para semáforo (traducido)
function getSemaforoTitulo(
  item: FeedItem,
  t: (key: string, values?: Record<string, string>) => string
): string {
  const color = getSemaforoColor(item);
  const puebloNombre = item.pueblo?.nombre ?? "Pueblo";

  if (color) {
    const statusKey =
      color === "verde"
        ? "semaforoStatusGreen"
        : color === "amarillo"
          ? "semaforoStatusYellow"
          : "semaforoStatusRed";
    return t("semaforoPuebloIs", {
      pueblo: puebloNombre,
      status: t(statusKey),
    });
  }

  return t("semaforoPuebloUpdated", { pueblo: puebloNombre });
}

function getItemHref(item: FeedItem): string | null {
  if (item.contenidoSlug) return `/c/${item.contenidoSlug}`;
  if (item.contenidoUrl) return item.contenidoUrl;
  if (item.slug) {
    if (item.tipo === "NOTICIA") return `/noticias/${item.slug}`;
    if (item.tipo === "EVENTO") return `/eventos/${item.slug}`;
  }
  if (item.tipo === "SEMAFORO" && item.pueblo?.slug) return `/pueblos/${item.pueblo.slug}`;
  return null;
}

export default function NotificacionesFeed() {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("TODAS");

  useEffect(() => {
    async function loadFeed() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/public/notificaciones/feed?lang=${encodeURIComponent(locale)}`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();
        // publicFeed devuelve array plano; algunas rutas devuelven { items: [] }
        const rawItems = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : (data.data ?? []));

        // FILTRADO: tipos permitidos SIN METEO
        const tiposPermitidos = ["NOTICIA", "EVENTO", "ALERTA", "ALERTA_PUEBLO", "SEMAFORO"];
        const tiposExcluidos = ["NOTICIA_PUEBLO", "EVENTO_PUEBLO", "METEO"];
        
        const preFiltered = rawItems.filter((item: any) => {
          const tipo = (item.tipo ?? item.type ?? "").toUpperCase();
          return tiposPermitidos.includes(tipo) && !tiposExcluidos.includes(tipo);
        });

        // Normalizar items al formato común
        const normalized: FeedItem[] = preFiltered
          .map((item: any) => {
            const tipo = (item.tipo ?? item.type ?? "").toUpperCase();
            
            // Normalización robusta de fecha
            const fecha = item.fecha ?? item.fechaInicio ?? item.createdAt ?? item.updatedAt ?? null;
            const fechaISO = fecha ? new Date(fecha).toISOString() : new Date().toISOString();
            
            const texto = item.contenido ?? item.descripcion ?? item.mensaje ?? "";

            // Título
            let titulo = item.titulo ?? "";
            if (!titulo) {
              titulo = ""; // Se mostrará traducido en UI con t('noTitle')
            }

            return {
              id: item.id ?? item.refId ?? Math.random(),
              tipo: tipo as FeedItem["tipo"],
              titulo: titulo,
              texto: String(texto),
              fecha: fechaISO,
              slug: item.slug ?? null,
              contenidoSlug: item.contenidoSlug ?? null,
              contenidoUrl: item.contenidoUrl ?? null,
              pueblo: item.pueblo ?? null,
              estado: item.estado ?? null,
              motivoPublico: item.motivoPublico ?? null,
            };
          })
          .filter((item: FeedItem) => {
            // Validación final: solo tipos permitidos SIN METEO
            return ["NOTICIA", "EVENTO", "ALERTA", "ALERTA_PUEBLO", "SEMAFORO"].includes(item.tipo);
          });

        // Ordenar por fecha desc usando helper seguro
        normalized.sort((a, b) => {
          const msA = toMs(a.fecha);
          const msB = toMs(b.fecha);
          return msB - msA;
        });

        setItems(normalized);
      } catch (e: any) {
        setItems([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    }

    loadFeed();
  }, []);

  // Filtrar items según el filtro seleccionado
  const filteredItems = items.filter((item) => {
    if (filter === "TODAS") return true;
    if (filter === "ALERTA") {
      return item.tipo === "ALERTA" || item.tipo === "ALERTA_PUEBLO";
    }
    return item.tipo === filter;
  });

  function getTipoLabel(tipo: FeedItem["tipo"]): string {
    switch (tipo) {
      case "NOTICIA":
        return t("news");
      case "EVENTO":
        return t("events");
      case "ALERTA":
        return t("alerts");
      case "ALERTA_PUEBLO":
        return t("alertaPueblo");
      case "SEMAFORO":
        return t("semaforos");
      case "METEO":
        return t("meteo");
      default:
        return tipo;
    }
  }

  function formatFecha(fecha: string): string {
    const ms = toMs(fecha);
    if (ms === 0) return t("dateUnavailable");
    try {
      const d = new Date(ms);
      return d.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return t("dateInvalid");
    }
  }

  function renderTitulo(item: FeedItem) {
    let tituloTexto: string;
    if (item.tipo === "SEMAFORO") {
      tituloTexto = getSemaforoTitulo(item, t);
    } else {
      tituloTexto = item.titulo || t("noTitle");
    }

    const href = getItemHref(item);
    const color = item.tipo === "SEMAFORO" ? getSemaforoColor(item) : null;

    if (href) {
      return (
        <Link
          href={href}
          className="font-bold mb-1 block text-foreground underline cursor-pointer hover:opacity-90"
        >
          {tituloTexto}
        </Link>
      );
    }

    return (
      <div className="font-bold mb-1">
        {tituloTexto}
        {color && (
          <span className="ml-2 text-sm text-muted-foreground">
            ● {color}
          </span>
        )}
      </div>
    );
  }

  if (loading) {
    return <div className="p-4 text-foreground">{t("loading")}</div>;
  }

  return (
    <div className="text-foreground">
      {/* Pestañas de filtro traducidas */}
      <div className="flex gap-2 mb-6 border-b border-border pb-2 items-center flex-wrap">
        {([
          { key: "TODAS", labelKey: "all" },
          { key: "NOTICIA", labelKey: "news" },
          { key: "EVENTO", labelKey: "events" },
          { key: "ALERTA", labelKey: "alerts" },
          { key: "SEMAFORO", labelKey: "semaforos" },
        ] as { key: FilterType; labelKey: string }[]).map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 border-none rounded cursor-pointer underline transition-colors ${
              filter === key
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-foreground hover:opacity-80"
            }`}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {/* Lista de items - visual plano */}
      {filteredItems.length === 0 ? (
        <div className="p-4 text-muted-foreground">
          {t("noNotifications")}
        </div>
      ) : (
        <ul className="list-none p-0 m-0">
          {filteredItems.map((item, idx) => {
            const href = getItemHref(item);

            const inner = (
              <>
                <div className="text-xs text-muted-foreground mb-2">
                  {formatFecha(item.fecha)} · {getTipoLabel(item.tipo)}
                  {item.pueblo && ` · ${t("village")} ${item.pueblo.nombre || item.pueblo.slug}`}
                </div>

                {renderTitulo(item)}

                {item.tipo === "SEMAFORO" ? (
                  (() => {
                    const motivo = (item.texto ?? item.motivoPublico ?? '').trim();
                    const textoGen = (item.texto ?? '').trim();
                    const esGenerico = textoGen.toLowerCase().includes('cambio de estado') || 
                                      textoGen.toLowerCase().includes('actualizó');
                    
                    if (motivo && !esGenerico) {
                      return (
                        <div className="text-sm text-muted-foreground leading-snug mt-1">
                          {t("motivo")} {motivo}
                        </div>
                      );
                    }
                    
                    if (textoGen && !esGenerico && textoGen !== motivo) {
                      return (
                        <div className="text-sm text-muted-foreground leading-snug mt-1">
                          {textoGen}
                        </div>
                      );
                    }
                    
                    return null;
                  })()
                ) : (
                  item.texto && item.texto.trim() && (
                    <div className="text-sm text-muted-foreground leading-snug mt-1">
                      {item.texto}
                    </div>
                  )
                )}
              </>
            );

            return (
              <li key={item.id}>
                {idx > 0 && (
                  <hr className="border-0 border-t border-border m-0" />
                )}
                {href ? (
                  <Link href={href} className="block py-4 no-underline text-foreground hover:opacity-90">
                    {inner}
                  </Link>
                ) : (
                  <div className="py-4">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
