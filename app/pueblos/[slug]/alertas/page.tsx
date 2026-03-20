import Link from "next/link";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getApiUrl, getPuebloBySlug } from "@/lib/api";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  metaLocaleLead,
  seoDescription,
  seoTitle,
  titleLocaleSuffix,
  type SupportedLocale,
} from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const locSuf = titleLocaleSuffix(locale);
  const path = `/pueblos/${slug}/alertas`;

  let puebloName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  try {
    const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);
    if (pueblo?.nombre) puebloName = pueblo.nombre;
  } catch {
    // fallback
  }

  const title = seoTitle(`Alertas · ${puebloName}${locSuf}`);
  const description = seoDescription(
    `${metaLocaleLead(locale)}Alertas activas en ${puebloName}, uno de los pueblos más bonitos de España.`,
  );

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: false, follow: true },
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
    fetch(`${API_BASE}/pueblos/${slug}`, { cache: "no-store" }).catch(() => null),
    fetch(
      `${API_BASE}/public/notificaciones/feed?limit=200&tipos=ALERTA_PUEBLO`,
      { cache: "no-store" },
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
        className="mb-4 inline-block text-sm text-muted-foreground hover:underline"
      >
        ← Volver al pueblo
      </Link>

      <h1 className="text-4xl font-semibold">Alertas del pueblo</h1>
      <p className="mt-2 text-muted-foreground">
        {nombrePueblo} · {alertas.length} alerta{alertas.length === 1 ? "" : "s"} activa{alertas.length === 1 ? "" : "s"}
      </p>

      <div className="mt-8 space-y-4">
        {alertas.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            No hay alertas activas en este momento.
          </div>
        ) : (
          alertas.map((item) => (
            <article key={String(item.id)} className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-semibold text-foreground">{item.titulo || "Alerta"}</h2>
              {item.contenido?.trim() ? (
                <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{item.contenido}</p>
              ) : null}
              {item.createdAt ? (
                <p className="mt-3 text-xs text-muted-foreground">{formatFecha(item.createdAt)}</p>
              ) : null}
            </article>
          ))
        )}
      </div>
    </main>
  );
}
