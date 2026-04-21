import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getRutas } from "@/lib/api";
import { createExcerpt } from "@/lib/sanitizeHtml";
import { getBaseUrl, getCanonicalUrl, getLocaleAlternates, getOGLocale, type SupportedLocale } from "@/lib/seo";
import RutaMiniMap from "@/app/_components/RutaMiniMap";
import RutaCardStats from "@/app/_components/RutaCardStats";
import JsonLd from "@/app/components/seo/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("seo");
  const path = "/rutas";
  const title = t("rutasListTitle");
  const description = t("rutasListDescription");

  let firstCover: string | null = null;
  let rutasCount = 0;
  try {
    const rutas = await getRutas(locale);
    const activas = rutas.filter((r) => r.activo);
    rutasCount = activas.length;
    firstCover = activas.find((r) => r.foto_portada)?.foto_portada ?? null;
  } catch {
    firstCover = null;
  }
  const finalOgImage = firstCover ?? `${getBaseUrl()}/brand/logo-lpbe-1.png`;
  const hasContent = rutasCount > 0;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: hasContent, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
      type: "website",
      images: [{ url: finalOgImage, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [finalOgImage],
    },
  };
}

export const revalidate = 60;
export default async function RutasPage() {
  const locale = await getLocale();
  const t = await getTranslations("rutas");
  const tSeo = await getTranslations("seo");
  const tHome = await getTranslations("home");
  const rutas = await getRutas(locale);

  const rutasActivas = rutas.filter((r) => r.activo);

  const base = getBaseUrl();
  const pageUrl = getCanonicalUrl("/rutas", locale as SupportedLocale);
  const collectionLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: tSeo("rutasListTitle"),
    description: tSeo("rutasListDescription"),
    url: pageUrl,
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      name: "Los Pueblos Más Bonitos de España",
      url: base,
    },
    ...(rutasActivas.length > 0
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: rutasActivas.length,
            itemListElement: rutasActivas.slice(0, 100).map((r, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${base}/rutas/${r.slug}`,
              name: r.titulo,
            })),
          },
        }
      : {}),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: base },
      { "@type": "ListItem", position: 2, name: t("title"), item: pageUrl },
    ],
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-12">
      <JsonLd data={collectionLd} />
      <JsonLd data={breadcrumbLd} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-gray-600">
          {t("pageDesc")}
        </p>
      </div>

      {rutasActivas.length === 0 ? (
        <p className="text-gray-600">{t("noRoutes")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rutasActivas.map((ruta) => (
            <Link
              key={ruta.id}
              href={`/rutas/${ruta.slug}`}
              className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-lg hover:border-primary/30"
            >
              {/* Foto portada */}
              <div className="relative h-48 w-full overflow-hidden bg-accent">
                {ruta.foto_portada ? (
                  <img
                    src={ruta.foto_portada}
                    alt={ruta.titulo}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-accent">
                    <span className="text-sm text-muted-foreground">{tHome("noImage")}</span>
                  </div>
                )}
                {/* Logo overlay */}
                {ruta.logo?.url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 p-4">
                    <img
                      src={ruta.logo.url}
                      alt={ruta.logo.nombre}
                      className="max-h-16 max-w-[80%] object-contain drop-shadow-md"
                    />
                  </div>
                )}
              </div>

              {/* Franja de ubicación: mini-mapa + datos calculados via OSRM */}
              <div className="flex items-stretch gap-3 border-b border-border bg-accent/50 px-3 py-2.5">
                {/* Mini mapa */}
                <RutaMiniMap rutaId={ruta.id} width={100} height={70} />

                {/* Stats (calculadas dinámicamente via OSRM) */}
                <RutaCardStats rutaId={ruta.id} locale={locale} />
              </div>

              {/* Contenido */}
              <div className="p-4">
                <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {ruta.titulo}
                </h2>

                {/* Badges */}
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  {ruta.dificultad && (
                    <span className="rounded-full bg-accent px-2.5 py-0.5 font-medium text-accent-foreground">
                      {ruta.dificultad}
                    </span>
                  )}
                </div>

                {/* Descripción */}
                {ruta.descripcion && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {createExcerpt(ruta.descripcion, 120)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
