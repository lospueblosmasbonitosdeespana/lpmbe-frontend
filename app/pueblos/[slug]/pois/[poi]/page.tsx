import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getApiUrl } from "@/lib/api";
import {
  getBaseUrl,
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoDescription,
  seoTitle,
  uniqueH1ForLocale,
  type SupportedLocale,
} from "@/lib/seo";
import { fetchWithTimeout } from "@/lib/fetch-safe";
import { injectImgAlt, stripHtml } from "@/app/_lib/html";
import { sanitizeRichHtml } from "@/app/_lib/sanitize-rich-html";
import ZoomableImage from "@/app/components/ZoomableImage";
import JsonLd from "@/app/components/seo/JsonLd";

export const revalidate = 60;
function isNumeric(s: string) {
  return /^\d+$/.test(s);
}

/**
 * Generate fallback candidate slugs when the original is not found.
 * Caso real observado en GSC y logs de producción:
 *   Google tiene indexadas URLs legacy con sufijo numérico (fuente-de-san-antonio-1,
 *   plaza-mayor-2, etc.) que ya no existen. El canónico actual es siempre el base
 *   sin sufijo. Por eso devolvemos SOLO el base: un único intento extra, sin
 *   amplificar con -1..-4 (eso generaba 8-10 404 por cada visita real en el log
 *   del backend).
 *
 * Si el slug ya no tiene sufijo y falla, no adivinamos: devolvemos lista vacía.
 */
function slugFallbackCandidates(slug: string): string[] {
  const match = slug.match(/^(.+)-(\d+)$/);
  if (match) return [match[1]];
  return [];
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

type PoiFetchResult = { data: any; redirectSlug?: string } | null;

/**
 * Fetch canónico del POI, compartido entre `generateMetadata` y el render de la
 * página gracias a `cache()` de React: una sola llamada al backend por visita
 * (antes se llamaba 2 veces, una por metadata y otra por render → 2× 404 en log).
 */
const fetchPoi = cache(
  async (puebloSlug: string, poiParam: string, locale?: string): Promise<PoiFetchResult> => {
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
          timeoutMs: 4000,
          retries: 0,
        });
        if (res.ok) return res.json();
      } catch { /* ignore */ }
      return null;
    };

    // 1) Slug original en el idioma pedido.
    let data = await tryFetch(poiParam, locale);
    // 2) Fallback a ES sólo si no es ya ES (POIs tienen i18n cargado en el mismo registro;
    //    este reintento cubre casos de slugs que existen en ES pero no en otro locale).
    if (!data && locale && locale !== "es") data = await tryFetch(poiParam, "es");
    if (data) return { data };

    // 3) Fallback controlado a slug base sin sufijo (1 solo intento). Cubre URLs
    //    legacy indexadas por Google con -1/-2/… que ahora son duplicados.
    if (!isNumeric(poiParam)) {
      for (const candidate of slugFallbackCandidates(poiParam)) {
        data = await tryFetch(candidate, locale);
        if (!data && locale && locale !== "es") data = await tryFetch(candidate, "es");
        if (data) return { data, redirectSlug: candidate };
      }
    }

    return null;
  },
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; poi: string }>;
}): Promise<Metadata> {
  const { slug, poi } = await params;
  const locale = await getLocale();
  const tSeo = await getTranslations("seo");
  const puebloName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const result = await fetchPoi(slug, poi, locale);
  const data = result?.data ?? null;
  const hasPoiData = Boolean(data?.nombre?.trim());
  const poiReadable = data?.nombre?.trim() || poi.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const path = `/pueblos/${slug}/pois/${poi}`;
  const title = hasPoiData
    ? seoTitle(`${poiReadable} · ${puebloName}`)
    : seoTitle(tSeo("lugaresDeInteresTitle", { nombre: puebloName }));
  const descSource = data?.descripcion_larga || data?.descripcionLarga || data?.descripcion || "";
  const descClean = descSource ? stripHtml(String(descSource)).trim() : "";
  const description = hasPoiData
    ? seoDescription(descClean || `${poiReadable} · ${puebloName}`, 160)
    : seoDescription(tSeo("lugaresDeInteresDesc", { nombre: puebloName }), 160);
  const alternates = hasPoiData
    ? {
        canonical: getCanonicalUrl(path, locale as SupportedLocale),
        languages: getLocaleAlternates(path),
      }
    : undefined;

  const poiImage = pickFotoPrincipal(data) ?? null;
  const ogImages = poiImage ? [{ url: poiImage }] : undefined;

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
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: ogImages ? "summary_large_image" : "summary",
      title,
      description,
      ...(poiImage ? { images: [poiImage] } : {}),
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
  const result = await fetchPoi(puebloSlug, poi, locale);

  if (result?.redirectSlug) {
    redirect(`/pueblos/${puebloSlug}/pois/${result.redirectSlug}`);
  }

  const data = result?.data ?? null;
  if (!data) {
    notFound();
  }

  // Si llegamos con un ID numérico pero el POI tiene slug, redirigir al slug canónico
  if (isNumeric(poi) && data.slug?.trim()) {
    redirect(`/pueblos/${puebloSlug}/pois/${data.slug.trim()}`);
  }

  const foto = pickFotoPrincipal(data);
  const descripcionHtml = pickDescripcionHtml(data);
  const puebloNombre = data.pueblo?.nombre ?? "Pueblo";
  const puebloProvincia = data.pueblo?.provincia ?? null;
  const puebloComunidad = data.pueblo?.comunidad ?? null;

  const base = getBaseUrl();
  const poiUrl = `${base}/pueblos/${puebloSlug}/pois/${poi}`;
  const allPhotos = (() => {
    const urls: string[] = [];
    if (foto) urls.push(foto);
    const fotos = Array.isArray(data?.fotosPoi) ? data.fotosPoi : [];
    for (const f of fotos) {
      const u = typeof f?.url === "string" ? f.url : null;
      if (u && !urls.includes(u)) urls.push(u);
    }
    return urls.slice(0, 10);
  })();

  const descTextPoi = descripcionHtml ? stripHtml(descripcionHtml).slice(0, 300) : "";

  const containedInPlace = puebloProvincia
    ? {
        "@type": "AdministrativeArea",
        name: puebloProvincia,
        ...(puebloComunidad
          ? {
              containedInPlace: {
                "@type": "AdministrativeArea",
                name: puebloComunidad,
                containedInPlace: { "@type": "Country", name: "España" },
              },
            }
          : { containedInPlace: { "@type": "Country", name: "España" } }),
      }
    : undefined;

  const poiLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: data.nombre,
    url: poiUrl,
    ...(descTextPoi ? { description: descTextPoi } : {}),
    ...(allPhotos.length > 0 ? { image: allPhotos } : {}),
    ...(data.categoria ? { additionalType: String(data.categoria) } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: puebloNombre,
      ...(puebloProvincia ? { addressRegion: puebloProvincia } : {}),
      addressCountry: "ES",
    },
    ...(containedInPlace ? { containedInPlace } : {}),
    ...(data.lat && data.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: data.lat,
            longitude: data.lng,
          },
        }
      : {}),
    isPartOf: {
      "@type": "TouristAttraction",
      name: puebloNombre,
      url: `${base}/pueblos/${puebloSlug}`,
    },
  };

  const poiBreadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Pueblos", item: `${base}/pueblos` },
      { "@type": "ListItem", position: 2, name: puebloNombre, item: `${base}/pueblos/${puebloSlug}` },
      { "@type": "ListItem", position: 3, name: data.nombre, item: poiUrl },
    ],
  };

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
      <JsonLd data={poiLd} />
      <JsonLd data={poiBreadcrumbLd} />
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
            dangerouslySetInnerHTML={{ __html: injectImgAlt(sanitizeRichHtml(descripcionHtml), data.nombre ?? "Punto de interés") }}
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
