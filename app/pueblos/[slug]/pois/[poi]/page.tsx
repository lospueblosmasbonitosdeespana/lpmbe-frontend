import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getApiUrl } from "@/lib/api";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  seoDescription,
  seoTitlePoiWithStamp,
  titleLocaleSuffix,
  type SupportedLocale,
} from "@/lib/seo";
import { fetchWithTimeout } from "@/lib/fetch-safe";
import ZoomableImage from "@/app/components/ZoomableImage";

export const dynamic = "force-dynamic";

function isNumeric(s: string) {
  return /^\d+$/.test(s);
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

async function fetchPoi(puebloSlug: string, poiParam: string, locale?: string) {
  const API_BASE = getApiUrl();
  const buildUrl = (lang?: string) => {
    const qs = lang ? `?lang=${encodeURIComponent(lang)}` : "";
    return isNumeric(poiParam)
      ? `${API_BASE}/pueblos/${puebloSlug}/pois/${poiParam}${qs}`
      : `${API_BASE}/pueblos/${puebloSlug}/pois/slug/${poiParam}${qs}`;
  };

  const fetchOne = async (lang?: string) =>
    fetchWithTimeout(buildUrl(lang), {
      cache: "no-store",
      headers: lang ? { "Accept-Language": lang } : undefined,
    });

  try {
    const res = await fetchOne(locale);
    if (res.ok) return res.json();
    if (locale && locale !== "es") {
      const fallbackRes = await fetchOne("es");
      if (fallbackRes.ok) return fallbackRes.json();
    }
    return null;
  } catch {
    if (locale && locale !== "es") {
      try {
        const fallbackRes = await fetchOne("es");
        if (fallbackRes.ok) return fallbackRes.json();
      } catch {
        // ignore fallback error
      }
    }
    return null;
  }
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
      cache: "no-store",
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
    return null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; poi: string }>;
}): Promise<Metadata> {
  const { slug, poi } = await params;
  const locale = await getLocale();
  const locSuf = titleLocaleSuffix(locale);
  const puebloName = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const poiName = (isNumeric(poi) ? `POI ${poi}` : poi.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
  const path = `/pueblos/${slug}/pois/${poi}`;
  const title = seoTitlePoiWithStamp(poi, isNumeric(poi), poiName, puebloName, locSuf);
  return {
    title,
    description: seoDescription(`Información sobre ${poiName} en ${puebloName}.${locSuf}`, 160),
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
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
  const data = await fetchPoi(puebloSlug, poi, locale);
  if (!data) {
    return (
      <main className="mx-auto max-w-[1200px] px-6 py-8 bg-background">
        <h1 className="text-3xl font-bold text-foreground my-4">Punto de interés no disponible</h1>
        <p className="text-muted-foreground">No se ha podido cargar este punto de interés.</p>
        <Link
          href={`/pueblos/${puebloSlug}/lugares-de-interes`}
          className="mt-6 inline-block text-primary hover:underline"
        >
          Volver a lugares de interés
        </Link>
      </main>
    );
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
        {data.nombre} · {puebloNombre}
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
            dangerouslySetInnerHTML={{ __html: descripcionHtml }}
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
