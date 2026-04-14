import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getApiUrl } from "@/lib/api";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoDescription,
  seoTitle,
  uniqueH1ForLocale,
  type SupportedLocale,
} from "@/lib/seo";
import { fetchWithTimeout } from "@/lib/fetch-safe";
import { injectImgAlt } from "@/app/_lib/html";
import ZoomableImage from "@/app/components/ZoomableImage";

export const revalidate = 60;
function isNumeric(s: string) {
  return /^\d+$/.test(s);
}

/**
 * Generate candidate slugs when the original is not found.
 * Handles two cases:
 *  - slug has suffix -N: try other suffixes and the base
 *  - slug has NO suffix: try -1, -2, -3 (common migration artifact)
 */
function slugFallbackCandidates(slug: string): string[] {
  const match = slug.match(/^(.+)-(\d+)$/);
  if (match) {
    const base = match[1];
    const num = parseInt(match[2], 10);
    const candidates: string[] = [];
    for (let i = 1; i <= 4; i++) {
      if (i !== num) candidates.push(`${base}-${i}`);
    }
    candidates.push(base);
    return candidates;
  }
  return [`${slug}-1`, `${slug}-2`, `${slug}-3`];
}

function pickDescripcionHtml(poi: any): string | null {
  return (
    poi?.descripcion_larga ??
    poi?.descripcionLarga ??
    poi?.descripcion ??
    poi?.descripcionHtml ??
    null
  );
}

function pickFotoPrincipal(poi: any): string | null {
  const fotos = Array.isArray(poi?.fotosPoi) ? poi.fotosPoi : [];
  if (fotos.length > 0) {
    const principal = fotos.find((f: any) => f?.orden === 1) ?? fotos[0];
    if (principal?.url) return principal.url;
  }
  return poi?.fotoUrl ?? poi?.foto ?? poi?.imagen ?? null;
}

async function fetchPoiBySlugOrId(
  puebloSlug: string,
  poiParam: string,
  locale?: string,
): Promise<{ data: any; redirectSlug?: string } | null> {
  const API_BASE = getApiUrl();
  const buildUrl = (slug: string, lang?: string) => {
    const qs = lang ? `?lang=${encodeURIComponent(lang)}` : "";
    return isNumeric(slug)
      ? `${API_BASE}/pueblos/${puebloSlug}/pois/${slug}${qs}`
      : `${API_BASE}/pueblos/${puebloSlug}/pois/slug/${slug}${qs}`;
  };

  const tryFetch = async (slug: string, lang?: string) => {
    try {
      const res = await fetchWithTimeout(buildUrl(slug, lang), {
        headers: lang ? { "Accept-Language": lang } : undefined,
      });
      if (res.ok) return res.json();
    } catch { /* ignore */ }
    return null;
  };

  // Try the original slug
  let data = await tryFetch(poiParam, locale);
  if (!data && locale && locale !== "es") data = await tryFetch(poiParam, "es");
  if (data) return { data };

  // Slug not found — try fallback candidates (handles deleted duplicates)
  if (!isNumeric(poiParam)) {
    for (const candidate of slugFallbackCandidates(poiParam)) {
      data = await tryFetch(candidate, locale);
      if (!data && locale && locale !== "es") data = await tryFetch(candidate, "es");
      if (data) return { data, redirectSlug: candidate };
    }
  }

  return null;
}

async function fetchPoiFast(puebloSlug: string, poiParam: string, locale?: string) {
  const API_BASE = getApiUrl();
  const buildUrl = (lang?: string) => {
    const qs = lang ? `?lang=${encodeURIComponent(lang)}` : "";
    return isNumeric(poiParam)
      ? `${API_BASE}/pueblos/${puebloSlug}/pois/${poiParam}${qs}`
      : `${API_BASE}/pueblos/${puebloSlug}/pois/slug/${poiParam}${qs}`;
  };
  const fetchOne = async (lang?: string) =>
    fetchWithTimeout(buildUrl(lang), {
      headers: lang ? { "Accept-Language": lang } : undefined,
      timeoutMs: 4000,
      retries: 0,
    });
  try {
    const res = await fetchOne(locale);
    if (res.ok) return res.json();
    if (locale && locale !== "es") {
      const fb = await fetchOne("es");
      if (fb.ok) return fb.json();
    }
  } catch { /* ignore */ }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; poi: string }>;
}): Promise<Metadata> {
  const { slug, poi } = await params;
  const locale = await getLocale();
  const tSeo = await getTranslations("seo");
  const puebloName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const data = await fetchPoiFast(slug, poi, locale);
  const hasPoiData = Boolean(data?.nombre?.trim());
  const poiReadable = data?.nombre?.trim() || poi.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const path = `/pueblos/${slug}/pois/${poi}`;
  const title = hasPoiData
    ? seoTitle(`${poiReadable} · ${puebloName}`)
    : seoTitle(tSeo("lugaresDeInteresTitle", { nombre: puebloName }));
  const description = hasPoiData
    ? seoDescription(`${poiReadable} · ${puebloName}`, 160)
    : seoDescription(tSeo("lugaresDeInteresDesc", { nombre: puebloName }), 160);
  const alternates = hasPoiData
    ? {
        canonical: getCanonicalUrl(path, locale as SupportedLocale),
        languages: getLocaleAlternates(path),
      }
    : undefined;

  return {
    title,
    description,
    alternates,
    robots: { index: hasPoiData, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      locale: getOGLocale(locale as SupportedLocale),
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PoiPage({
  params,
}: {
  params: Promise<{ slug: string; poi: string }>;
}) {
  const { slug: puebloSlug, poi } = await params;
  const locale = await getLocale();
  const t = await getTranslations("poiPage");
  const result = await fetchPoiBySlugOrId(puebloSlug, poi, locale);

  if (result?.redirectSlug) {
    redirect(`/pueblos/${puebloSlug}/pois/${result.redirectSlug}`);
  }

  const data = result?.data ?? null;
  if (!data) {
    notFound();
  }

  const foto = pickFotoPrincipal(data);
  const descripcionHtml = pickDescripcionHtml(data);
  const puebloNombre = data.pueblo?.nombre ?? "Pueblo";
  const puebloProvincia = data.pueblo?.provincia ?? null;
  const puebloComunidad = data.pueblo?.comunidad ?? null;
  const backToVars = {
    nombre: puebloNombre,
    name: puebloNombre,
    Name: puebloNombre,
    nom: puebloNombre,
    nome: puebloNombre,
    titulo: puebloNombre,
    title: puebloNombre,
    Titel: puebloNombre,
  };

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-8 bg-background">
      <div className="mb-6">
        <Link href={`/pueblos/${puebloSlug}`} className="text-primary hover:underline">
          {t("backTo", backToVars)}
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-foreground my-4">
        {uniqueH1ForLocale(`${data.nombre} · ${puebloNombre}`, locale)}
      </h1>

      <p className="text-sm text-muted-foreground my-2">
        {puebloProvincia ?? ""}
        {puebloProvincia && puebloComunidad ? " · " : ""}
        {puebloComunidad ?? ""}
      </p>

      {data.categoria && (
        <p className="text-sm text-muted-foreground my-2">
          {data.categoria}
        </p>
      )}

      {/* FOTO PRINCIPAL Y DESCRIPCIÓN: mismo ancho para alinear */}
      {foto ? (
        <section className="mt-8 w-full max-w-3xl">
          <ZoomableImage
            src={foto}
            alt={data?.nombre ?? "POI"}
            rotation={(() => {
              const fotos = Array.isArray(data?.fotosPoi) ? data.fotosPoi : [];
              const principal = fotos.find((f: any) => f?.orden === 1) ?? fotos[0];
              return principal?.rotation ?? 0;
            })()}
            wrapperClassName="relative aspect-[4/3] w-full rounded-xl bg-muted"
            fit="contain"
            loading="eager"
          />
        </section>
      ) : null}

      {/* GALERÍA DE FOTOS (si hay más de 1) */}
      {(() => {
        const fotos = Array.isArray(data?.fotosPoi) ? data.fotosPoi : [];
        const fotosSorted = [...fotos].sort((a, b) => (a.orden ?? 999) - (b.orden ?? 999));
        
        if (fotosSorted.length <= 1) return null;
        
        return (
          <section className="mt-8 w-full max-w-3xl">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t("gallery")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {fotosSorted.map((foto: any, idx: number) => (
                <ZoomableImage
                  key={foto.id ?? idx}
                  src={foto.url}
                  alt={foto.alt ?? `${data.nombre} - Foto ${idx + 1}`}
                  rotation={foto.rotation}
                  wrapperClassName="relative aspect-[4/3] rounded-xl bg-muted"
                  fit="contain"
                />
              ))}
            </div>
          </section>
        );
      })()}

      {/* DESCRIPCIÓN: mismo ancho que la foto para alinear texto e imagen */}
      {descripcionHtml ? (
        <section className="mt-8 w-full max-w-3xl">
          <div
            className="prose prose-gray dark:prose-invert prose-lg max-w-none text-foreground [&_p]:leading-relaxed [&_p]:text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_li]:text-foreground [&_strong]:text-foreground [&_p]:max-w-none"
            dangerouslySetInnerHTML={{ __html: injectImgAlt(descripcionHtml, data.nombre ?? "Punto de interés") }}
          />
        </section>
      ) : (
        <section className="mt-8 w-full max-w-3xl">
          <p className="text-muted-foreground text-sm">
            {t("descriptionComingSoon")}
          </p>
        </section>
      )}

      {/* UBICACIÓN */}
      {data.lat && data.lng && (
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            {t("location")}
          </h2>
          <a
            href={`https://www.google.com/maps?q=${data.lat},${data.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2.5 text-sm rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-colors"
          >
            {t("viewOnGoogleMaps")}
          </a>
        </section>
      )}
    </main>
  );
}
