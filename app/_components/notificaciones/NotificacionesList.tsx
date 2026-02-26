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
  pueblo?: { nombre?: string | null; slug?: string | null } | null;
  estado?: string | null;
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

function getSemaforoTitle(it: Item): string {
  const colorMap: Record<string, string> = {
    VERDE: "verde",
    AMARILLO: "amarillo",
    ROJO: "rojo",
  };
  const color = colorMap[(it.estado ?? "").toUpperCase()] ?? "";
  const pueblo = it.pueblo?.nombre || it.puebloNombre || "";
  if (color && pueblo) return `Semáforo ${color} en ${pueblo}`;
  if (pueblo) return `Semáforo en ${pueblo}`;
  return it.titulo || "Semáforo";
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
        const isSemaforo = (it.tipo ?? "").toUpperCase() === "SEMAFORO";
        const pueblo = isSemaforo ? "" : (it.puebloNombre || it.pueblo?.nombre || "");
        const fecha = formatFecha(it);
        const titulo = isSemaforo ? getSemaforoTitle(it) : (it.titulo || "Notificación").trim();
        const subtexto = isSemaforo
          ? (it.motivoPublico || it.contenido || "").trim() || null
          : (it.mensaje || it.contenido || it.motivoPublico || "").trim() || null;

        const link = it.url || it.href || (it.id ? `/notificaciones#notif-${it.id}` : "/notificaciones");
        const itemId = it.id ? `notif-${it.id}` : undefined;

        return (
          <div key={key} id={itemId}>
            <Link
              href={link}
              className="block rounded-lg border border-border bg-card p-3 text-foreground no-underline transition-colors hover:bg-muted/50"
            >
              <div className="font-bold mb-1">{titulo}</div>
              {pueblo ? <div className="text-sm text-muted-foreground">Pueblo: {pueblo}</div> : null}
              {fecha ? <div className="text-sm text-muted-foreground">{fecha}</div> : null}
              {!isSemaforo && it.tipo ? <div className="text-sm text-muted-foreground">Tipo: {it.tipo}</div> : null}
              {subtexto ? (
                <div className="text-sm text-muted-foreground mt-2">{subtexto}</div>
              ) : null}
            </Link>
          </div>
        );
      })}
    </div>
  );
}

