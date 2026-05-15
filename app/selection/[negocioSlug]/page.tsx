import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  getCanonicalUrl, getLocaleAlternates, getOGLocale, seoTitle, seoDescription,
  getLocaleFromRequestHeaders, type SupportedLocale,
} from "@/lib/seo";
import { getNegocioBySlug } from "@/app/_lib/club/club-helpers";
import SelectionPremiumDetail from "@/app/_components/selection/SelectionPremiumDetail";
import { buildBusinessJsonLd } from "@/app/_lib/seo/business-json-ld";

const ROUTE_SLUG = "selection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ negocioSlug: string }>;
}): Promise<Metadata> {
  const { negocioSlug } = await params;
  const hdrs = await headers();
  const locale = getLocaleFromRequestHeaders(hdrs) as SupportedLocale;

  const recurso = await getNegocioBySlug(negocioSlug, locale);
  if (!recurso) return { title: "No encontrado" };

  const nombre = recurso.nombre ?? negocioSlug;
  const localidad = (recurso as any).localidad
    ?? (recurso as any).pueblo?.nombre
    ?? "";
  const title = seoTitle(`${nombre}${localidad ? ` · ${localidad}` : ""}`);
  const description = seoDescription(
    recurso.descripcion
      ?? `${nombre} — establecimiento Selection de Los Pueblos Más Bonitos de España`
  );
  const path = `/${ROUTE_SLUG}/${negocioSlug}`;
  const ogImage =
    (recurso as any).imagenes?.[0]?.url ??
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://lpmbe-frontend.vercel.app"}/brand/logo-lpbe-1.png`;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
      type: "website",
      images: [{ url: ogImage, alt: nombre }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
    robots: { index: true, follow: true },
  };
}

export default async function SelectionNegocioPage({
  params,
}: {
  params: Promise<{ negocioSlug: string }>;
}) {
  const { negocioSlug } = await params;
  const hdrs = await headers();
  const locale = getLocaleFromRequestHeaders(hdrs) as SupportedLocale;

  const recurso = await getNegocioBySlug(negocioSlug, locale);
  if (!recurso) notFound();

  const jsonLd = buildBusinessJsonLd(
    recurso as any,
    `/${ROUTE_SLUG}/${negocioSlug}`,
    locale,
    { schemaType: "LodgingBusiness" },
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SelectionPremiumDetail recurso={recurso as any} />
    </>
  );
}
