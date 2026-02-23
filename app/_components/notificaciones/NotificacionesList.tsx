"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

type Item = {
  id?: string | number;
  tipo?: string | null;
  titulo?: string | null;
  mensaje?: string | null;
  contenido?: string | null;
  motivoPublico?: string | null;
  createdAt?: string | null;
  fecha?: string | null;
  puebloNombre?: string | null;
  pueblo?: { nombre?: string | null } | null;
  url?: string | null;
  href?: string | null;
};

function formatFecha(it: Item) {
  const raw = it.createdAt || it.fecha;
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-ES");
}

export default function NotificacionesList({ items }: { items: Item[] }) {
  const t = useTranslations("notifications");
  if (!items || items.length === 0) {
    return <p>{t("noNotificationsYet")}</p>;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((it, idx) => {
        const key = `${it.id ?? ""}-${it.tipo ?? ""}-${it.createdAt ?? it.fecha ?? ""}-${idx}`;
        const pueblo = it.puebloNombre || it.pueblo?.nombre || "";
        const fecha = formatFecha(it);
        
        // Helper para generar link: prioridad url/href, fallback a anchor
        const link = it.url || it.href || (it.id ? `/notificaciones#notif-${it.id}` : '/notificaciones');
        const itemId = it.id ? `notif-${it.id}` : undefined;

        return (
          <div key={key} id={itemId}>
            <Link
              href={link}
              style={{
                display: "block",
                textDecoration: "none",
                color: "inherit",
                padding: "12px",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f9fafb";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>
                {(it.titulo || "Notificación").trim()}
              </div>
              {pueblo ? <div style={{ fontSize: 14, color: "#666" }}>Pueblo: {pueblo}</div> : null}
              {fecha ? <div style={{ fontSize: 14, color: "#666" }}>{fecha}</div> : null}
              {it.tipo ? <div style={{ fontSize: 14, color: "#666" }}>Tipo: {it.tipo}</div> : null}
              {(it.mensaje || it.contenido || it.motivoPublico) ? (
                <div style={{ fontSize: 14, color: "#666", marginTop: 8 }}>
                  {it.mensaje || it.contenido || it.motivoPublico}
                </div>
              ) : null}
            </Link>
          </div>
        );
      })}
    </div>
  );
}

