import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCanonicalUrl, getLocaleAlternates, seoTitle, seoDescription, getLocaleFromRequestHeaders, type SupportedLocale } from "@/lib/seo";
import { CATEGORY_LABELS, CATEGORY_API_KEYS, getPaginasTematicasByPueblo, slugify, slugToTitle } from "@/app/_lib/tematica/tematica-helpers";
import { TematicaListPageUI } from "@/app/_lib/tematica/TematicaPageComponents";

export const dynamic = "force-dynamic";
const SLUG = "en-familia";

export async function generateMetadata({ params }: { params: Promise<{ puebloSlug: string }> }): Promise<Metadata> {
  const { puebloSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const label = CATEGORY_LABELS[SLUG]?.[locale] ?? CATEGORY_LABELS[SLUG].es;
  const puebloNombre = slugToTitle(puebloSlug);
  const path = `/${SLUG}/${puebloSlug}`;
  return {
    title: seoTitle(`${label} en ${puebloNombre}`),
    description: seoDescription(`Descubre actividades ${label.toLowerCase()} en ${puebloNombre}. Los Pueblos Más Bonitos de España.`),
    alternates: { canonical: getCanonicalUrl(path, locale as SupportedLocale), languages: getLocaleAlternates(path) },
    robots: { index: true, follow: true },
  };
}

export default async function EnFamiliaListPage({ params }: { params: Promise<{ puebloSlug: string }> }) {
  const { puebloSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const pages = await getPaginasTematicasByPueblo(puebloSlug, CATEGORY_API_KEYS[SLUG], locale);
  if (!pages.length) return notFound();
  return <TematicaListPageUI slug={SLUG} puebloSlug={puebloSlug} locale={locale} pages={pages} slugify={slugify} />;
}
