import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getLugarLegacyBySlug, getApiUrl, type Pueblo } from "@/lib/api";
import { getCanonicalUrl, getLocaleAlternates, type SupportedLocale } from "@/lib/seo";
import ParadasMap from "@/app/_components/ParadasMap";

// Helpers para SEO
function cleanText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function cut(input: string, max = 160) {
  const s = cleanText(input);
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

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
export const dynamic = "force-dynamic";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; mxSlug: string }>;
}): Promise<Metadata> {
  const { slug, mxSlug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("mxPage");
  const pueblo = await getLugarLegacyBySlug(slug, locale);

  // Buscar la multiexperiencia por slug (soportar formato plano y anidado)
  const mxItem = (pueblo.multiexperiencias ?? []).find((x: any) => {
    const s = x?.slug ?? x?.multiexperiencia?.slug ?? null;
    return s === mxSlug;
  });
  
  // Normalizar: si viene anidada, usa x.multiexperiencia; si viene plana, usa x
  const mx = (mxItem?.multiexperiencia ?? mxItem ?? null) as Multiexperiencia | null;
  
  const expTitle = mx?.titulo ?? t("experienceFallback");
  const title = `${expTitle} – ${pueblo.nombre} – Los Pueblos Más Bonitos de España`;
  const heroImage =
    mx?.foto ??
    pueblo.foto_destacada ??
    pueblo.fotos?.[0]?.url ??
    null;
  const descSource = mx?.descripcion ?? null;
  const description = descSource
    ? cut(descSource, 160)
    : "Detalle de la experiencia y sus paradas.";
  const path = `/pueblos/${pueblo.slug}/experiencias/${mxSlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      type: "article",
      images: heroImage
        ? [{ url: heroImage, alt: `${expTitle} – ${pueblo.nombre}` }]
        : undefined,
    },
    twitter: {
      card: heroImage ? "summary_large_image" : "summary",
      title,
      description,
      images: heroImage ? [heroImage] : undefined,
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
  const pueblo = await getLugarLegacyBySlug(slug, locale);

  // Buscar la multiexperiencia por slug (soportar formato plano y anidado)
  const mxItem = (pueblo.multiexperiencias ?? []).find((x: any) => {
    const s = x?.slug ?? x?.multiexperiencia?.slug ?? null;
    return s === mxSlug;
  });

  // Normalizar: si viene anidada, usa x.multiexperiencia; si viene plana, usa x
  const mx = (mxItem?.multiexperiencia ?? mxItem ?? null) as Multiexperiencia | null;

  if (!mx) {
    throw new Error("Multiexperiencia no encontrada");
  }

  // Obtener paradas fusionadas (legacy + overrides + custom) desde el endpoint público del backend
  let paradas: any[] = [];
  
  if (mx.id) {
    try {
      const apiBase = getApiUrl();
      const langQs = locale ? `?lang=${encodeURIComponent(locale)}` : "";
      const res = await fetch(`${apiBase}/multiexperiencias/${mx.id}/paradas${langQs}`, {
        cache: "no-store",
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

  return (
    <main className="mx-auto max-w-[1200px] px-6 py-8 bg-background">
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
      <h1 className="text-foreground text-3xl font-bold">{mx.titulo}</h1>

      {/* Información del pueblo */}
      <p className="mt-2 text-sm text-muted-foreground">
        {pueblo.nombre} · {pueblo.provincia} · {pueblo.comunidad}
      </p>

      {/* Foto padre */}
      {mx.foto && (
        <div className="mt-6">
          <img
            src={mx.foto}
            alt={mx.titulo}
            className="w-full max-h-[400px] object-cover rounded-lg"
          />
        </div>
      )}

      {/* Descripción */}
      <section className="mt-8">
        <p className="text-foreground">
          {mx.descripcion ?? "Descripción próximamente."}
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
                  className="rounded-xl overflow-hidden border border-border bg-card dark:bg-card"
                >
                  {/* Foto */}
                  {p.foto ? (
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                      <img
                        src={p.foto}
                        alt={p.titulo ?? t("stopFallback")}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        loading="lazy"
                      />
                    </div>
                  ) : null}

                  {/* Contenido */}
                  <div className="p-5">
                    {/* Número + Título */}
                    <div className="flex items-center gap-3">
                      {!p.foto && (
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary text-primary-foreground text-base font-extrabold shrink-0 shadow-sm">
                          {num}
                        </span>
                      )}
                      {p.titulo ? (
                        <h3 className="text-xl font-semibold text-foreground leading-tight m-0">
                          {p.foto && (
                            <span className="text-primary font-bold">{num}. </span>
                          )}
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

