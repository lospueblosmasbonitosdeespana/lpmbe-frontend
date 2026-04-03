import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCanonicalUrl, getLocaleAlternates, seoTitle, seoDescription, getLocaleFromRequestHeaders, getOGLocale, type SupportedLocale } from "@/lib/seo";
import { CATEGORY_API_KEYS, getPaginasTematicasByPuebloWithEsFallback, slugify, slugToTitle } from "@/app/_lib/tematica/tematica-helpers";
import { TematicaListPageUI } from "@/app/_lib/tematica/TematicaPageComponents";

export const dynamic = "force-dynamic";
const SLUG = "gastronomia";
const URL_SLUG = "que-comer";

export async function generateMetadata({ params }: { params: Promise<{ puebloSlug: string }> }): Promise<Metadata> {
  const { puebloSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const tSeo = await getTranslations("seo");
  const puebloNombre = slugToTitle(puebloSlug);
  const pages = await getPaginasTematicasByPuebloWithEsFallback(puebloSlug, CATEGORY_API_KEYS[SLUG], locale);
  const hasValidContent = pages.length > 0;
  const path = `/${URL_SLUG}/${puebloSlug}`;
  const title = seoTitle(tSeo("queComerTitle", { nombre: puebloNombre }));
  const description = seoDescription(tSeo("queComerDesc", { nombre: puebloNombre }));
  return {
    title,
    description,
    alternates: { canonical: getCanonicalUrl(path, locale as SupportedLocale), languages: getLocaleAlternates(path) },
    robots: { index: hasValidContent, follow: true },
    openGraph: { title, description, type: "website", url: getCanonicalUrl(path, locale as SupportedLocale), locale: getOGLocale(locale as SupportedLocale) },
  };
}

export default async function QueComerListPage({ params }: { params: Promise<{ puebloSlug: string }> }) {
  const { puebloSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const pages = await getPaginasTematicasByPuebloWithEsFallback(puebloSlug, CATEGORY_API_KEYS[SLUG], locale);
  if (!pages.length) return notFound();
  return <TematicaListPageUI slug={URL_SLUG} puebloSlug={puebloSlug} locale={locale} pages={pages} slugify={slugify} />;
}
