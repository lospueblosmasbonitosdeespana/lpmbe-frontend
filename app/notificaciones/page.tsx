"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
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

  // Garantiza array plano
  return raw.filter(Boolean);
}

const NOTIFICACIONES_VISTAS_KEY = "lpmbe_notificaciones_vistas_at";

export default function NotificacionesPage() {
  const locale = useLocale();
  const t = useTranslations("notifications");
  const tHome = useTranslations("home");
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Al entrar en esta página, marcar notificaciones como vistas (para que el badge en home desaparezca)
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
        const res = await fetch(`/api/public/notificaciones/feed?lang=${encodeURIComponent(locale)}`, { cache: "no-store" });
        const data = await res.json().catch(() => null);
        const normalized = normalizeFeed(data);
        if (alive) {
          setItems(normalized);
          
          // Scroll a anchor si hay hash en la URL
          if (typeof window !== 'undefined' && window.location.hash) {
            setTimeout(() => {
              const element = document.querySelector(window.location.hash);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 100);
          }
        }
      } catch (e: any) {
        if (alive) setErr(t("loadCenterError"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [locale]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-4xl font-semibold">{tHome("notifCenterTitle")}</h1>
          <p className="mt-2 text-gray-600">{t("pageSubtitle")}</p>
        </div>
        <Link
          href="/meteo"
          className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition font-medium text-foreground"
        >
          <Cloud className="h-4 w-4" />
          {t("meteoAlerts")}
        </Link>
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
