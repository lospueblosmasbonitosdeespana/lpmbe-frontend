import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { stripHtml } from "@/app/_lib/html";
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, seoTitle, seoDescription, getLocaleFromRequestHeaders, type SupportedLocale } from "@/lib/seo";
import { CATEGORY_LABELS, CATEGORY_API_KEYS, getPaginaTematicaBySlug, slugToTitle } from "@/app/_lib/tematica/tematica-helpers";
import { TematicaDetailPage } from "@/app/_lib/tematica/TematicaPageComponents";

export const dynamic = "force-dynamic";
const SLUG = "patrimonio";

export async function generateMetadata({ params }: { params: Promise<{ puebloSlug: string; pageSlug: string }> }): Promise<Metadata> {
  const { puebloSlug, pageSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const tSeo = await getTranslations("seo");
  const label = CATEGORY_LABELS[SLUG]?.[locale] ?? CATEGORY_LABELS[SLUG].es;
  const puebloNombre = slugToTitle(puebloSlug);
  const page = await getPaginaTematicaBySlug(puebloSlug, CATEGORY_API_KEYS[SLUG], pageSlug, locale);
  const titulo = page?.titulo ?? slugToTitle(pageSlug);
  const hasValidContent = Boolean(page?.titulo?.trim());
  const path = `/${SLUG}/${puebloSlug}/${pageSlug}`;
  const titleText = seoTitle(tSeo("tematicaDetalleTitle", { titulo, pueblo: puebloNombre }));
  const descText = seoDescription(page?.resumen ? stripHtml(page.resumen) : tSeo("tematicaDetalleDesc", { titulo, pueblo: puebloNombre }));
  const alternates = hasValidContent
    ? { canonical: getCanonicalUrl(path, locale as SupportedLocale), languages: getLocaleAlternates(path) }
    : undefined;
  return {
    title: titleText,
    description: descText,
    alternates,
    robots: { index: hasValidContent, follow: true },
    openGraph: { title: titleText, description: descText, url: getCanonicalUrl(path, locale as SupportedLocale), ...(page?.coverUrl ? { images: [{ url: page.coverUrl }] } : {}), type: "article", locale: getOGLocale(locale as SupportedLocale) },
    other: { "article:section": label },
  };
}

export default async function PatrimonioDetailPage({ params }: { params: Promise<{ puebloSlug: string; pageSlug: string }> }) {
  const { puebloSlug, pageSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  return <TematicaDetailPage slug={SLUG} puebloSlug={puebloSlug} pageSlug={pageSlug} locale={locale} />;
}
