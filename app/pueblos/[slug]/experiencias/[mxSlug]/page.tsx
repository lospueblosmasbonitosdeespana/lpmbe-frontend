import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getApiUrl, getPuebloBySlug, type Pueblo } from "@/lib/api";
import {
  DEFAULT_DESCRIPTION,
  getBaseUrl,
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoTitle,
  seoDescription,
  slugDisambiguatorForTitle,
  slugToTitle,
  uniqueH1ForLocale,
  type SupportedLocale,
} from "@/lib/seo";
import ParadasMap from "@/app/_components/ParadasMap";
import ParadaFoto from "./ParadaFoto";
import JsonLd from "@/app/components/seo/JsonLd";
import ZoomableImage from "@/app/components/ZoomableImage";

type Poi = {
  id: number;
  nombre: string;
  descripcion_corta: string | null;
  descripcion_larga: string | null;
  foto: string | null;
  lat: number | null;
  lng: number | null;
  categoria: string | null;
  orden: number | null;
  puebloId: number;
};

type Multiexperiencia = {
  id: number;
  titulo: string;
  descripcion: string | null;
  foto: string | null;
  slug: string;
  categoria?: string | null;
  tipo?: "LOCAL" | "NACIONAL" | string;
  programa?: string | null;
  qr?: string | null;
  puntos?: number | null;
  activo?: boolean | null;
  legacyId?: number | null;
};

// 🔒 Forzamos render dinámico (no SSG)
export const revalidate = 60;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; mxSlug: string }>;
}): Promise<Metadata> {
  const { slug, mxSlug } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations("seo");
  const fallbackPuebloName = slugToTitle(slug);
  const fallbackExpName = slugToTitle(mxSlug);
  const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);
  const puebloName = pueblo?.nombre?.trim() || fallbackPuebloName;
  let expName = fallbackExpName;
  let descPlain = "";
  let hasValidExperience = false;

  if (pueblo) {
    const mxItem = (pueblo.multiexperiencias ?? []).find((x: any) => {
      const s = x?.slug ?? x?.multiexperiencia?.slug ?? null;
      return s === mxSlug;
    });
    const mx = (mxItem?.multiexperiencia ?? mxItem ?? null) as Multiexperiencia | null;
    if (mx?.titulo?.trim()) {
      expName = mx.titulo.trim();
      descPlain = mx.descripcion
        ? mx.descripcion.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 130)
        : "";
      hasValidExperience = true;
    }
  }

  const path = `/pueblos/${slug}/experiencias/${mxSlug}`;
  const mxDis = slugDisambiguatorForTitle(mxSlug);
  const title = seoTitle(`${expName} · ${puebloName}${mxDis}`);
  const description = hasValidExperience
    ? seoDescription(`${expName} · ${puebloName}${descPlain ? `. ${descPlain}` : ""}`) || DEFAULT_DESCRIPTION
    : seoDescription(tSeo("tematicaDetalleDesc", { titulo: expName, pueblo: puebloName })) || DEFAULT_DESCRIPTION;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: hasValidExperience, follow: true },
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

export default async function MultiexperienciaPage({
  params,
}: {
  params: Promise<{ slug: string; mxSlug: string }>;
}) {
  const { slug, mxSlug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("mxPage");
  const pueblo = await getPuebloBySlug(slug, locale).catch(() => null);
  if (!pueblo) {
    return (
      <main className="mx-auto max-w-[1200px] px-6 py-8 bg-background">
        <h1 className="text-foreground text-3xl font-bold">{t("experienceFallback")}</h1>
        <p className="mt-3 text-muted-foreground">No se ha podido cargar esta experiencia en este momento.</p>
        <Link href="/pueblos" className="mt-6 inline-block text-primary hover:underline">
          {t("backToVillage")}
        </Link>
      </main>
    );
  }

  // Buscar la multiexperiencia por slug (soportar formato plano y anidado)
  const mxItem = (pueblo.multiexperiencias ?? []).find((x: any) => {
    const s = x?.slug ?? x?.multiexperiencia?.slug ?? null;
    return s === mxSlug;
  });

  // Normalizar: si viene anidada, usa x.multiexperiencia; si viene plana, usa x
  const mx = (mxItem?.multiexperiencia ?? mxItem ?? null) as Multiexperiencia | null;

  if (!mx) {
    return (
      <main className="mx-auto max-w-[1200px] px-6 py-8 bg-background">
        <h1 className="text-foreground text-3xl font-bold">{t("experienceFallback")}</h1>
        <p className="mt-3 text-muted-foreground">La experiencia solicitada no est\u00e1 disponible.</p>
        <Link href={`/pueblos/${pueblo.slug}/multiexperiencias`} className="mt-6 inline-block text-primary hover:underline">
          {t("backTo", { nombre: pueblo.nombre })}
        </Link>
      </main>
    );
  }

  // Obtener paradas fusionadas (legacy + overrides + custom) desde el endpoint público del backend
  let paradas: any[] = [];
  
  if (mx.id) {
    try {
      const apiBase = getApiUrl();
      const langQs = locale ? `?lang=${encodeURIComponent(locale)}` : "";
      const res = await fetch(`${apiBase}/multiexperiencias/${mx.id}/paradas${langQs}`, {
        headers: locale ? { "Accept-Language": locale } : undefined,
      });
      
      if (res.ok) {
        paradas = await res.json();
        console.log(`[MX ${mx.id}] Paradas fusionadas:`, paradas.length);
      } else {
        console.error(`[MX ${mx.id}] Error cargando paradas:`, res.status);
      }
    } catch (err) {
      console.error(`[MX ${mx.id}] Error fetching paradas:`, err);
    }
  }

  const tPueblo = await getTranslations("puebloPage");
  const base = getBaseUrl();
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tPueblo("breadcrumbHome"), item: base },
      { "@type": "ListItem", position: 2, name: tPueblo("breadcrumbPueblos"), item: `${base}/pueblos` },
      { "@type": "ListItem", position: 3, name: pueblo.nombre, item: `${base}/pueblos/${pueblo.slug}` },
      { "@type": "ListItem", position: 4, name: mx.titulo, item: `${base}/pueblos/${pueblo.slug}/experiencias/${mxSlug}` },
    ],
  };

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-8 bg-background">
      <JsonLd data={breadcrumbLd} />
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/pueblos/${pueblo.slug}`}
          className="text-primary hover:underline"
        >
          {t("backTo", { nombre: pueblo.nombre })}
        </Link>
      </div>

      {/* Título */}
      <h1 className="text-foreground text-3xl font-bold">{uniqueH1ForLocale(mx.titulo, locale)}</h1>

      {/* Información del pueblo */}
      <p className="mt-2 text-sm text-muted-foreground">
        {pueblo.nombre} · {pueblo.provincia} · {pueblo.comunidad}
      </p>

      {/* Foto padre */}
      {mx.foto && (
        <div className="mt-6">
          <ZoomableImage
            src={mx.foto}
            alt={mx.titulo}
            wrapperClassName="w-full max-h-[420px] rounded-lg"
            className="max-h-[420px] bg-muted"
            fit="contain"
          />
        </div>
      )}

      {/* Descripción */}
      <section className="mt-8">
        <p className="text-foreground">
          {mx.descripcion ?? t("descriptionComingSoon")}
        </p>
      </section>

      {/* Resumen de la experiencia */}
      <section className="mt-8 p-5 rounded-lg border border-border bg-muted/50 dark:bg-card">
        <h2 className="mt-0 mb-4 text-foreground font-semibold">
          {t("experienceSummary")}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/pueblos/${pueblo.slug}`}
            className="inline-block px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground hover:bg-muted"
          >
            {t("backToVillage")}
          </Link>
          <Link
            href={`/pueblos/${pueblo.slug}#mapa`}
            className="inline-block px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground hover:bg-muted"
          >
            {t("viewVillageMap")}
          </Link>
          {pueblo.lat && pueblo.lng ? (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${pueblo.lat},${pueblo.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2.5 text-sm rounded-md border border-border bg-background text-foreground hover:bg-muted"
            >
              {t("howToGetThere")}
            </a>
          ) : (
            <button
              disabled
              className="inline-block px-4 py-2.5 text-sm rounded-md border border-border bg-muted cursor-not-allowed text-muted-foreground"
            >
              {t("howToGetThere")}
            </button>
          )}
        </div>

        {/* Mapa de paradas */}
        <div className="mt-5">
          <h3 className="mb-3 text-base font-medium text-foreground">
            {t("routeMap")}
          </h3>
          <ParadasMap paradas={paradas} puebloNombre={pueblo.nombre} />
        </div>
      </section>

      {/* Paradas */}
      <section className="mt-8">
        <h2 className="mb-2 text-foreground font-semibold">{t("stops")}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {t("stopsCount", { count: paradas.length })}
        </p>
        {paradas.length === 0 ? (
          <p>{t("noStops")}</p>
        ) : (
          <div className="flex flex-col gap-6">
            {paradas.map((p: any, idx: number) => {
              const key = p.kind === 'LEGACY' 
                ? `L-${p.legacyLugarId}` 
                : `C-${p.customId ?? idx}`;
              const num = idx + 1;
              
              return (
                <article
                  key={key}
                  id={`parada-${num}`}
                  className="rounded-xl overflow-hidden border border-border bg-card dark:bg-card scroll-mt-4"
                >
                  {/* Foto: usa Client Component para ocultar el bloque si la imagen falla */}
                  {p.foto ? (
                    <ParadaFoto src={p.foto} alt={p.titulo ?? t("stopFallback")} />
                  ) : null}

                  {/* Contenido */}
                  <div className="p-5">
                    {/* Número + Título */}
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-base font-extrabold shrink-0 shadow-sm">
                        {num}
                      </span>
                      {p.titulo ? (
                        <h3 className="text-xl font-semibold text-foreground leading-tight m-0">
                          {p.titulo}
                        </h3>
                      ) : (
                        <h3 className="text-xl font-semibold text-muted-foreground m-0">
                          {t("stop", { num })}
                        </h3>
                      )}
                    </div>

                    {/* Descripción */}
                    {p.descripcion ? (
                      <div className="mt-3 text-[15px] leading-relaxed text-foreground dark:text-card-foreground whitespace-pre-wrap">
                        {p.descripcion}
                      </div>
                    ) : (
                      <p className="mt-3 text-muted-foreground text-sm italic">
                        {t("descriptionComingSoon")}
                      </p>
                    )}

                    {/* Enlace Google Maps */}
                    {typeof p.lat === "number" && typeof p.lng === "number" ? (
                      <div className="mt-3">
                        <a
                          href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[13px] text-primary hover:underline"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {t("viewOnGoogleMaps")}
                        </a>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

