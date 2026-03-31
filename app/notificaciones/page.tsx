"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Cloud } from "lucide-react";
import NotificacionesList from "../_components/notificaciones/NotificacionesList";

type NotifItem = {
  id?: string | number;
  tipo?: string;
  titulo?: string;
  mensaje?: string;
  contenido?: string;
  motivoPublico?: string;
  createdAt?: string;
  fecha?: string;
  puebloNombre?: string;
  pueblo?: { nombre?: string };
  url?: string;
  href?: string;
};

function normalizeFeed(data: any): NotifItem[] {
  const raw =
    Array.isArray(data) ? data :
    Array.isArray(data?.items) ? data.items :
    Array.isArray(data?.data) ? data.data :
    [];
  return raw.filter(Boolean);
}

const NOTIFICACIONES_VISTAS_KEY = "lpmbe_notificaciones_vistas_at";

function NotificacionesContent() {
  const locale = useLocale();
  const t = useTranslations("notifications");
  const tHome = useTranslations("home");
  const searchParams = useSearchParams();
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const tipoQuery = (searchParams.get("tipo") ?? "").toUpperCase();
  const tiposParam =
    tipoQuery === "ALERTA"
      ? "ALERTA,ALERTA_PUEBLO"
      : tipoQuery === "SEMAFORO"
        ? "SEMAFORO"
        : tipoQuery || "NOTICIA,EVENTO,ALERTA,ALERTA_PUEBLO,SEMAFORO";

  // Al entrar en esta página, marcar notificaciones como vistas
  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICACIONES_VISTAS_KEY, new Date().toISOString());
    } catch {
      // ignorar si localStorage no está disponible
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(
          `/api/public/notificaciones/feed?lang=${encodeURIComponent(locale)}&tipos=${encodeURIComponent(tiposParam)}`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => null);
        const normalized = normalizeFeed(data).filter((it) => {
          const tipo = String(it.tipo ?? "").toUpperCase();
          if (tipoQuery === "ALERTA") return tipo === "ALERTA" || tipo === "ALERTA_PUEBLO";
          if (tipoQuery === "SEMAFORO") return tipo === "SEMAFORO";
          return true;
        });
        if (alive) {
          setItems(normalized);
          // Scroll a anchor si hay hash en la URL
          if (typeof window !== "undefined" && window.location.hash) {
            setTimeout(() => {
              const element = document.querySelector(window.location.hash);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }, 100);
          }
        }
      } catch {
        if (alive) setErr(t("loadCenterError"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [locale, tipoQuery, tiposParam]);

  const titleByTipo: Record<string, string> = {
    SEMAFORO: "Semáforos",
    ALERTA: "Alertas",
    NOTICIA: "Noticias",
    EVENTO: "Eventos",
  };
  const pageTitle = tipoQuery && titleByTipo[tipoQuery]
    ? titleByTipo[tipoQuery]
    : tHome("notifCenterTitle");

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-4xl font-semibold">{pageTitle}</h1>
          <p className="mt-2 text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/alertas"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition font-medium text-foreground text-sm"
          >
            ⚠️ Alertas activas
          </Link>
          <Link
            href="/meteo"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition font-medium text-foreground text-sm"
          >
            <Cloud className="h-4 w-4" />
            {t("meteoAlerts")}
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="mt-8">{t("loading")}</p>
      ) : err ? (
        <div className="mt-8">
          <p className="text-red-600">{err}</p>
          <button
            className="mt-4 rounded px-4 py-2 border"
            onClick={() => window.location.reload()}
          >
            {t("retry")}
          </button>
        </div>
      ) : (
        <div className="mt-8">
          <NotificacionesList items={items} />
        </div>
      )}
    </div>
  );
}

export default function NotificacionesPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-6 py-10 text-muted-foreground">Cargando...</div>}>
      <NotificacionesContent />
    </Suspense>
  );
}
