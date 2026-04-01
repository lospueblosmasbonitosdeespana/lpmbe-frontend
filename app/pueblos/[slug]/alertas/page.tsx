import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AlertTriangle } from "lucide-react";
import { getApiUrl, getPuebloBySlug } from "@/lib/api";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoDescription,
  seoTitle,
  type SupportedLocale,
} from "@/lib/seo";

export const revalidate = 60;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations("seo");
  const path = `/pueblos/${slug}/alertas`;

  let puebloName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  try {
    const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);
    if (pueblo?.nombre) puebloName = pueblo.nombre;
  } catch {
    // fallback
  }

  const title = seoTitle(tSeo("alertasPuebloTitle", { nombre: puebloName }));
  const description = seoDescription(tSeo("alertasPuebloDesc", { nombre: puebloName }));

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
    },
  };
}

type AlertaItem = {
  id: number | string;
  titulo?: string | null;
  contenido?: string | null;
  createdAt?: string;
  pueblo?: { slug?: string | null; nombre?: string | null } | null;
};

function formatFecha(raw?: string) {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-ES");
}

export default async function AlertasPuebloPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const API_BASE = getApiUrl();

  const [puebloRes, alertasRes] = await Promise.all([
    fetch(`${API_BASE}/pueblos/${slug}`).catch(() => null),
    fetch(
      `${API_BASE}/public/notificaciones/feed?limit=200&tipos=ALERTA_PUEBLO`,
    ).catch(() => null),
  ]);

  const pueblo = puebloRes?.ok ? await puebloRes.json().catch(() => null) : null;
  const rawFeed: unknown = alertasRes?.ok ? await alertasRes.json().catch(() => []) : [];
  const feedObj = rawFeed as { items?: AlertaItem[] } | null;
  const feedItems: AlertaItem[] = Array.isArray(rawFeed)
    ? rawFeed
    : (Array.isArray(feedObj?.items) ? feedObj.items : []);

  const alertas = feedItems
    .filter((item) => item?.pueblo?.slug === slug)
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());

  const nombrePueblo = pueblo?.nombre ?? slug;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href={`/pueblos/${slug}`}
        className="mb-6 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Volver al pueblo
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h1 className="text-4xl font-semibold">Alertas en {nombrePueblo}</h1>
        </div>
        {alertas.length > 0 ? (
          <p className="inline-flex items-center gap-2 rounded-lg bg-amber-100 border border-amber-300 px-3 py-1.5 text-sm font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Atención a los visitantes
          </p>
        ) : (
          <p className="text-muted-foreground">
            No hay alertas activas en este momento.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {alertas.length === 0 ? (
          <div className="rounded-xl border border-border bg-muted/30 p-8 text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay alertas activas en este momento.</p>
          </div>
        ) : (
          alertas.map((item) => (
            <article
              key={String(item.id)}
              className="rounded-xl border border-orange-200 bg-orange-50 p-5"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{item.titulo || "Alerta"}</p>
                  {item.contenido?.trim() ? (
                    <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                      {item.contenido}
                    </p>
                  ) : null}
                  {item.createdAt ? (
                    <p className="mt-3 text-xs text-muted-foreground">{formatFecha(item.createdAt)}</p>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="mt-10">
        <Link href="/alertas" className="text-sm hover:underline text-muted-foreground">
          ← Ver todas las alertas activas
        </Link>
      </div>
    </main>
  );
}
