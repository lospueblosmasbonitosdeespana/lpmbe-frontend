"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type FeedItem = {
  id: string | number;
  tipo: "NOTICIA" | "EVENTO" | "ALERTA" | "ALERTA_PUEBLO" | "SEMAFORO";
  titulo: string;
  texto: string;
  fecha: string;
  pueblo?: {
    id: number;
    nombre: string;
    slug: string;
  } | null;
  estado?: string | null; // Para SEMAFORO
  motivoPublico?: string | null; // Para SEMAFORO: motivo público del cambio
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

// Generar título para semáforo
function getSemaforoTitulo(item: FeedItem): string {
  const color = getSemaforoColor(item);
  const puebloNombre = item.pueblo?.nombre ?? "Pueblo";

  // SIEMPRE usar formato con color si existe
  if (color) {
    return `${puebloNombre} está en ${color}`;
  }

  // Si no hay color, el problema es que el backend no lo manda
  // Fallback temporal (debería desaparecer cuando backend mande estado)
  return `${puebloNombre} actualizó su semáforo`;
}

// Generar href según tipo
function getItemHref(item: FeedItem): string | null {
  if (item.tipo === "SEMAFORO" && item.pueblo?.slug) {
    return `/pueblos/${item.pueblo.slug}`;
  }
  // Para otros tipos, no linkear todavía
  return null;
}

export default function NotificacionesFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("TODAS");

  useEffect(() => {
    async function loadFeed() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/notificaciones/feed", {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json();
        const rawItems = Array.isArray(data.items) ? data.items : (data.items ?? data.data ?? []);

        // FILTRADO DOBLE: aunque el proxy filtre, volver a filtrar por seguridad
        const tiposPermitidos = ["NOTICIA", "EVENTO", "ALERTA", "ALERTA_PUEBLO", "SEMAFORO"];
        const tiposExcluidos = ["NOTICIA_PUEBLO", "EVENTO_PUEBLO"];
        
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

            return {
              id: item.id ?? item.refId ?? Math.random(),
              tipo: tipo as FeedItem["tipo"],
              titulo: item.titulo ?? "(sin título)",
              texto: String(texto),
              fecha: fechaISO,
              pueblo: item.pueblo ?? null,
              estado: item.estado ?? null,
              motivoPublico: item.motivoPublico ?? null,
            };
          })
          .filter((item: FeedItem) => {
            // Validación final: solo tipos permitidos
            return tiposPermitidos.includes(item.tipo);
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
        return "Noticia";
      case "EVENTO":
        return "Evento";
      case "ALERTA":
        return "Alerta";
      case "ALERTA_PUEBLO":
        return "Alerta pueblo";
      case "SEMAFORO":
        return "Semáforo";
      default:
        return tipo;
    }
  }

  function formatFecha(fecha: string): string {
    const ms = toMs(fecha);
    if (ms === 0) return "Fecha no disponible";
    
    try {
      const d = new Date(ms);
      return d.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha inválida";
    }
  }

  function renderTitulo(item: FeedItem) {
    let tituloTexto: string;
    
    if (item.tipo === "SEMAFORO") {
      tituloTexto = getSemaforoTitulo(item);
    } else {
      tituloTexto = item.titulo || "(sin título)";
    }

    const href = getItemHref(item);
    const color = item.tipo === "SEMAFORO" ? getSemaforoColor(item) : null;

    if (href) {
      return (
        <Link
          href={href}
          style={{
            fontWeight: "bold",
            marginBottom: "0.25rem",
            color: "#000",
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          {tituloTexto}
        </Link>
      );
    }

    return (
      <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
        {tituloTexto}
        {color && (
          <span style={{ marginLeft: "0.5rem", fontSize: "0.875rem", color: "#666" }}>
            ● {color}
          </span>
        )}
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: "1rem" }}>Cargando...</div>;
  }

  return (
    <div>
      {/* Pestañas de filtro en español */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          borderBottom: "1px solid #e5e5e5",
          paddingBottom: "0.5rem",
        }}
      >
        {([
          { key: "TODAS", label: "Todas" },
          { key: "NOTICIA", label: "Noticias" },
          { key: "EVENTO", label: "Eventos" },
          { key: "ALERTA", label: "Alertas" },
          { key: "SEMAFORO", label: "Semáforos" },
        ] as { key: FilterType; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: "0.5rem 1rem",
              border: "none",
              background: filter === key ? "#000" : "transparent",
              color: filter === key ? "#fff" : "#000",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de items - visual plano */}
      {filteredItems.length === 0 ? (
        <div style={{ padding: "1rem", color: "#666" }}>
          No hay notificaciones para mostrar.
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {filteredItems.map((item, idx) => {
            const href = getItemHref(item);
            const color = item.tipo === "SEMAFORO" ? getSemaforoColor(item) : null;

            return (
              <li key={item.id}>
                {idx > 0 && (
                  <hr style={{ border: "none", borderTop: "1px solid #e5e5e5", margin: 0 }} />
                )}
                <div style={{ padding: "1rem 0" }}>
                  {/* Línea meta (pequeña) */}
                  <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.5rem" }}>
                    {formatFecha(item.fecha)} · {getTipoLabel(item.tipo)}
                    {item.pueblo && ` · Pueblo: ${item.pueblo.nombre || item.pueblo.slug}`}
                  </div>

                  {/* Título (grande) */}
                  {renderTitulo(item)}

                  {/* Texto/Motivo (normal, opcional) */}
                  {item.tipo === "SEMAFORO" ? (
                    (() => {
                      const motivo = (item.motivoPublico ?? '').trim();
                      const textoGen = (item.texto ?? '').trim();
                      const esGenerico = textoGen.toLowerCase().includes('cambio de estado') || 
                                        textoGen.toLowerCase().includes('actualizó');
                      
                      // Si hay motivoPublico y no es genérico, mostrar "Motivo: {motivo}"
                      if (motivo && !esGenerico) {
                        return (
                          <div style={{ fontSize: "0.875rem", color: "#666", lineHeight: "1.5", marginTop: "0.25rem" }}>
                            Motivo: {motivo}
                          </div>
                        );
                      }
                      
                      // Si no hay motivo pero hay texto útil (y no es genérico), mostrarlo sin prefijo
                      if (textoGen && !esGenerico && textoGen !== motivo) {
                        return (
                          <div style={{ fontSize: "0.875rem", color: "#666", lineHeight: "1.5", marginTop: "0.25rem" }}>
                            {textoGen}
                          </div>
                        );
                      }
                      
                      return null;
                    })()
                  ) : (
                    item.texto && item.texto.trim() && (
                      <div style={{ fontSize: "0.875rem", color: "#666", lineHeight: "1.5", marginTop: "0.25rem" }}>
                        {item.texto}
                      </div>
                    )
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
