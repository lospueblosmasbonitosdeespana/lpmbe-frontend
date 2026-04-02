import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, seoTitle, seoDescription, getLocaleFromRequestHeaders, type SupportedLocale } from "@/lib/seo";
import { CATEGORY_API_KEYS, getPaginasTematicasByPuebloWithEsFallback, slugify, slugToTitle } from "@/app/_lib/tematica/tematica-helpers";
import { TematicaListPageUI } from "@/app/_lib/tematica/TematicaPageComponents";

export const dynamic = "force-dynamic";
const SLUG = "cultura";

export async function generateMetadata({ params }: { params: Promise<{ puebloSlug: string }> }): Promise<Metadata> {
  const { puebloSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const tSeo = await getTranslations("seo");
  const puebloNombre = slugToTitle(puebloSlug);
  const path = `/${SLUG}/${puebloSlug}`;
  const title = seoTitle(tSeo("culturaTitle", { nombre: puebloNombre }));
  const description = seoDescription(tSeo("culturaDesc", { nombre: puebloNombre }));
  return {
    title,
    description,
    alternates: { canonical: getCanonicalUrl(path, locale as SupportedLocale), languages: getLocaleAlternates(path) },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      locale: getOGLocale(locale as SupportedLocale),
    },
    robots: { index: true, follow: true },
  };
}

export default async function CulturaListPage({ params }: { params: Promise<{ puebloSlug: string }> }) {
  const { puebloSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const pages = await getPaginasTematicasByPuebloWithEsFallback(puebloSlug, CATEGORY_API_KEYS[SLUG], locale);
  if (!pages.length) return notFound();
  return <TematicaListPageUI slug={SLUG} puebloSlug={puebloSlug} locale={locale} pages={pages} slugify={slugify} />;
}
