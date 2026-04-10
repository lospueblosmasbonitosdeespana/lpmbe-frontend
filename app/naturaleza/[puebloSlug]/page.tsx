import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import {
  getCanonicalUrl, getLocaleAlternates, getOGLocale, seoTitle, seoDescription,
  getLocaleFromRequestHeaders, type SupportedLocale,
} from "@/lib/seo";
import {
  CATEGORY_API_KEYS, getPaginasTematicasByPuebloWithEsFallback, slugify, slugToTitle,
} from "@/app/_lib/tematica/tematica-helpers";
import { TematicaListPageUI, TematicaEmptyUI } from "@/app/_lib/tematica/TematicaPageComponents";

export const dynamic = "force-dynamic";
const SLUG = "naturaleza";

export async function generateMetadata({ params }: { params: Promise<{ puebloSlug: string }> }): Promise<Metadata> {
  const { puebloSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const tSeo = await getTranslations("seo");
  const puebloNombre = slugToTitle(puebloSlug);
  const pages = await getPaginasTematicasByPuebloWithEsFallback(puebloSlug, CATEGORY_API_KEYS[SLUG], locale);
  const hasValidContent = pages.length > 0;
  const path = `/${SLUG}/${puebloSlug}`;
  const title = seoTitle(tSeo("naturalezaTitle", { nombre: puebloNombre }));
  const description = seoDescription(tSeo("naturalezaDesc", { nombre: puebloNombre }));
  const alternates = hasValidContent
    ? { canonical: getCanonicalUrl(path, locale as SupportedLocale), languages: getLocaleAlternates(path) }
    : undefined;
  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      locale: getOGLocale(locale as SupportedLocale),
    },
    robots: { index: hasValidContent, follow: true },
  };
}

export default async function NaturalezaListPage({ params }: { params: Promise<{ puebloSlug: string }> }) {
  const { puebloSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const pages = await getPaginasTematicasByPuebloWithEsFallback(puebloSlug, CATEGORY_API_KEYS[SLUG], locale);
  if (!pages.length) return <TematicaEmptyUI slug={SLUG} puebloSlug={puebloSlug} locale={locale} />;
  return <TematicaListPageUI slug={SLUG} puebloSlug={puebloSlug} locale={locale} pages={pages} slugify={slugify} />;
}
