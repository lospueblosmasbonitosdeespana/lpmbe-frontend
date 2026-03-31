"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Newspaper,
  CalendarDays,
  Cloud,
  TrafficCone,
  Bell,
} from "lucide-react";

// ─── tipos ───────────────────────────────────────────────────────────────────

type FeedItem = {
  id?: string | number;
  tipo: "noticia" | "evento" | "alerta" | "semaforo" | string;
  titulo?: string | null;
  resumen?: string | null;
  contenido?: string | null;
  mensaje?: string | null;
  motivoPublico?: string | null;
  estado?: string | null;
  date: Date;
  href: string;
  puebloNombre?: string | null;
  puebloSlug?: string | null;
};

function normArray(data: unknown): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.data)) return d.data;
  }
  return [];
}

function formatFecha(d: Date) {
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── tarjeta individual ───────────────────────────────────────────────────────

function FeedCard({ item }: { item: FeedItem }) {
  const tipo = item.tipo.toLowerCase();
  const isAlerta = tipo === "alerta" || tipo === "alerta_pueblo";
  const isSemaforo = tipo === "semaforo";
  const isEvento = tipo === "evento";

  const color = isAlerta
    ? "border-orange-200 bg-orange-50"
    : isSemaforo
      ? "border-yellow-200 bg-yellow-50"
      : "border-border bg-card";

  const iconColor = isAlerta
    ? "text-orange-600"
    : isSemaforo
      ? "text-yellow-600"
      : isEvento
        ? "text-blue-600"
        : "text-primary";

  const Icon = isAlerta
    ? AlertTriangle
    : isSemaforo
      ? TrafficCone
      : isEvento
        ? CalendarDays
        : Newspaper;

  const subtexto = (
    item.resumen ||
    item.contenido ||
    item.mensaje ||
    item.motivoPublico ||
    ""
  ).trim();

  return (
    <Link
      href={item.href}
      className={`block rounded-xl border p-5 transition-colors hover:brightness-95 no-underline ${color}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          {item.puebloNombre && (
            <div className="mb-1">
              <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                📍 {item.puebloNombre}
              </span>
            </div>
          )}
          <p className="font-semibold text-foreground leading-snug">
            {item.titulo || "Sin título"}
          </p>
          {subtexto ? (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {subtexto}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {formatFecha(item.date)}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ─── contenido principal ──────────────────────────────────────────────────────

const TABS = [
  { id: "todo", label: "Todo", icon: Bell },
  { id: "noticias", label: "Noticias", icon: Newspaper },
  { id: "eventos", label: "Eventos", icon: CalendarDays },
  { id: "alertas", label: "Alertas", icon: AlertTriangle },
  { id: "semaforos", label: "Semáforos", icon: TrafficCone },
] as const;

type TabId = (typeof TABS)[number]["id"];

function NotificacionesContent() {
  const locale = useLocale();
  const t = useTranslations("notifications");
  const searchParams = useSearchParams();

  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // tab activo desde query param o default "todo"
  const tipoQuery = (searchParams.get("tipo") ?? "").toLowerCase();
  const initialTab: TabId =
    tipoQuery === "alerta"
      ? "alertas"
      : tipoQuery === "semaforo"
        ? "semaforos"
        : tipoQuery === "noticia"
          ? "noticias"
          : tipoQuery === "evento"
            ? "eventos"
            : "todo";

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  // Marcar vistas
  useEffect(() => {
    try {
      localStorage.setItem("lpmbe_notificaciones_vistas_at", new Date().toISOString());
    } catch { /* ignorar */ }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const lang = encodeURIComponent(locale);
        const [resNoticias, resEventos, resFeed] = await Promise.all([
          fetch(`/api/public/noticias?limit=20&lang=${lang}`, { cache: "no-store" }),
          fetch(`/api/public/eventos?limit=20&lang=${lang}`, { cache: "no-store" }),
          fetch(
            `/api/public/notificaciones/feed?limit=50&lang=${lang}&tipos=ALERTA,ALERTA_PUEBLO,SEMAFORO`,
            { cache: "no-store" },
          ),
        ]);

        const rawNoticias = normArray(resNoticias.ok ? await resNoticias.json().catch(() => []) : []);
        const rawEventos = normArray(resEventos.ok ? await resEventos.json().catch(() => []) : []);
        const rawFeed = normArray(resFeed.ok ? await resFeed.json().catch(() => []) : []);

        const noticias: FeedItem[] = rawNoticias.map((n: any) => ({
          id: n.id,
          tipo: "noticia",
          titulo: n.titulo || n.title,
          resumen: n.resumen || n.excerpt,
          date: new Date(n.publishedAt || n.createdAt || 0),
          href: n.slug ? `/noticias/${n.slug}` : "/actualidad",
        }));

        const eventos: FeedItem[] = rawEventos.map((e: any) => ({
          id: e.id,
          tipo: "evento",
          titulo: e.titulo || e.title,
          resumen: e.resumen || e.excerpt,
          date: new Date(e.fechaInicio || e.publishedAt || e.createdAt || 0),
          href: e.slug ? `/eventos/${e.slug}` : "/actualidad",
        }));

        const feedItems: FeedItem[] = rawFeed.map((f: any) => {
          const tipoRaw = String(f.tipo ?? "").toUpperCase();
          const isAlertaPueblo = tipoRaw === "ALERTA_PUEBLO";
          const puebloSlug = f.pueblo?.slug ?? null;
          const puebloNombre = f.pueblo?.nombre ?? f.puebloNombre ?? null;
          const href = isAlertaPueblo && puebloSlug
            ? `/pueblos/${puebloSlug}/alertas`
            : tipoRaw === "ALERTA"
              ? (f.id ? `/notificaciones#notif-${f.id}` : "/alertas")
              : "/notificaciones";
          return {
            id: f.id,
            tipo: tipoRaw === "SEMAFORO" ? "semaforo" : "alerta",
            titulo: f.titulo,
            contenido: f.contenido,
            mensaje: f.mensaje,
            motivoPublico: f.motivoPublico,
            estado: f.estado,
            date: new Date(f.createdAt || f.fecha || 0),
            href,
            puebloNombre,
            puebloSlug,
          };
        });

        const merged = [...noticias, ...eventos, ...feedItems].sort(
          (a, b) => b.date.getTime() - a.date.getTime(),
        );

        if (alive) setItems(merged);
      } catch {
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [locale]);

  const filtered = items.filter((it) => {
    if (activeTab === "todo") return true;
    if (activeTab === "noticias") return it.tipo === "noticia";
    if (activeTab === "eventos") return it.tipo === "evento";
    if (activeTab === "alertas") return it.tipo === "alerta" || it.tipo === "ALERTA_PUEBLO";
    if (activeTab === "semaforos") return it.tipo === "semaforo";
    return true;
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-semibold">Centro de notificaciones</h1>
          <p className="mt-2 text-muted-foreground">
            Noticias, alertas y estado de semáforos.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/alertas"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg hover:bg-muted/50 transition text-sm font-medium"
          >
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Alertas activas
          </Link>
          <Link
            href="/meteo"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg hover:bg-muted/50 transition text-sm font-medium"
          >
            <Cloud className="h-4 w-4" />
            {t("meteoAlerts")}
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => {
          const count =
            id === "todo"
              ? items.length
              : items.filter((it) => {
                  if (id === "noticias") return it.tipo === "noticia";
                  if (id === "eventos") return it.tipo === "evento";
                  if (id === "alertas") return it.tipo === "alerta" || it.tipo === "ALERTA_PUEBLO";
                  if (id === "semaforos") return it.tipo === "semaforo";
                  return false;
                }).length;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count > 0 && (
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/30 p-10 text-center text-muted-foreground">
          <Bell className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay elementos en esta categoría.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => (
            <FeedCard key={`${item.tipo}-${item.id ?? idx}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotificacionesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-6 py-10 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      }
    >
      <NotificacionesContent />
    </Suspense>
  );
}
