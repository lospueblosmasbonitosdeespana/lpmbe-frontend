import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getApiUrl } from "@/lib/api";
import { AlertTriangle } from "lucide-react";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  type SupportedLocale,
} from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("notifications");
  const path = "/alertas";

  return {
    title: `${t("alertasPageTitle")} — Los Pueblos Más Bonitos de España`,
    description: t("alertasPageDesc"),
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title: `${t("alertasPageTitle")} — Los Pueblos Más Bonitos de España`,
      description: t("alertasPageDesc"),
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
    },
    robots: { index: false, follow: true },
  };
}

type AlertaRaw = {
  id: number | string;
  tipo?: string | null;
  titulo?: string | null;
  contenido?: string | null;
  mensaje?: string | null;
  createdAt?: string | null;
  fecha?: string | null;
  puebloId?: number | null;
  pueblo?: { id?: number; slug?: string | null; nombre?: string | null } | null;
  puebloNombre?: string | null;
};

function formatFecha(raw: string | null | undefined, locale: string) {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  // Mapeo: 'ca' → 'ca-ES', resto → '{locale}-ES' con fallback a 'es-ES'
  const localeTag =
    locale === "ca" ? "ca-ES" :
    locale === "en" ? "en-GB" :
    locale === "fr" ? "fr-FR" :
    locale === "de" ? "de-DE" :
    locale === "pt" ? "pt-PT" :
    locale === "it" ? "it-IT" :
    "es-ES";
  return d.toLocaleString(localeTag, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AlertasPage() {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("notifications");
  const API_BASE = getApiUrl();

  let alertas: AlertaRaw[] = [];
  try {
    const res = await fetch(
      `${API_BASE}/public/notificaciones/feed?limit=100&tipos=ALERTA,ALERTA_PUEBLO&lang=${locale}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const raw = await res.json().catch(() => []);
      const arr = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.items)
          ? raw.items
          : [];
      alertas = arr.filter((it: AlertaRaw) => {
        const tipo = String(it?.tipo ?? "").toUpperCase();
        return tipo === "ALERTA" || tipo === "ALERTA_PUEBLO";
      });
    }
  } catch {
    // silencioso
  }

  const globalAlerts = alertas.filter(
    (it) => !it.puebloId && String(it.tipo ?? "").toUpperCase() === "ALERTA",
  );
  const puebloAlerts = alertas.filter(
    (it) =>
      it.puebloId || String(it.tipo ?? "").toUpperCase() === "ALERTA_PUEBLO",
  );

  const total = alertas.length;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h1 className="text-4xl font-semibold">{t("alertasPageTitle")}</h1>
        </div>
        <p className="text-muted-foreground">
          {total === 0
            ? t("alertasNone")
            : t("alertasCount", { count: total })}
        </p>
      </div>

      {/* Alertas de la Asociación */}
      {globalAlerts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="inline-block rounded-full bg-red-600 px-3 py-0.5 text-xs font-bold text-white uppercase tracking-wide">
              {t("alertasAssocSection")}
            </span>
          </h2>
          <div className="space-y-4">
            {globalAlerts.map((item) => (
              <article
                key={String(item.id)}
                className="rounded-xl border border-red-200 bg-red-50 p-5"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">
                      {item.titulo || t("alertaDefault")}
                    </p>
                    {(item.contenido || item.mensaje)?.trim() ? (
                      <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                        {item.contenido || item.mensaje}
                      </p>
                    ) : null}
                    {(item.createdAt || item.fecha) ? (
                      <p className="mt-3 text-xs text-muted-foreground">
                        {formatFecha(item.createdAt || item.fecha, locale)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Alertas de pueblos */}
      {puebloAlerts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">
            {t("alertasPueblosSection")}
          </h2>
          <div className="space-y-4">
            {puebloAlerts.map((item) => {
              const puebloSlug = item.pueblo?.slug ?? null;
              const puebloNombre =
                item.pueblo?.nombre ?? item.puebloNombre ?? null;
              const detailHref = puebloSlug
                ? `/pueblos/${puebloSlug}/alertas`
                : null;

              return (
                <article
                  key={String(item.id)}
                  className="rounded-xl border border-orange-200 bg-orange-50 p-5"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      {puebloNombre && (
                        <div className="mb-2">
                          {detailHref ? (
                            <Link
                              href={detailHref}
                              className="inline-flex items-center gap-1.5 rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white uppercase tracking-wide hover:bg-orange-700 transition-colors"
                            >
                              📍 {puebloNombre}
                            </Link>
                          ) : (
                            <span className="inline-block rounded-full bg-orange-600 px-3 py-1 text-xs font-bold text-white uppercase tracking-wide">
                              📍 {puebloNombre}
                            </span>
                          )}
                        </div>
                      )}

                      <p className="font-semibold text-foreground">
                        {item.titulo || t("alertaDefault")}
                      </p>
                      {(item.contenido || item.mensaje)?.trim() ? (
                        <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                          {item.contenido || item.mensaje}
                        </p>
                      ) : null}
                      {(item.createdAt || item.fecha) ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          {formatFecha(item.createdAt || item.fecha, locale)}
                        </p>
                      ) : null}

                      {detailHref && puebloNombre && (
                        <Link
                          href={detailHref}
                          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:underline"
                        >
                          {t("alertasVerTodas", { nombre: puebloNombre })}
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {total === 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-8 text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t("alertasNone")}</p>
        </div>
      )}

      <div className="mt-10">
        <Link
          href="/notificaciones"
          className="text-sm hover:underline text-muted-foreground"
        >
          {t("alertasBackLink")}
        </Link>
      </div>
    </main>
  );
}
