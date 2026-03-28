import type { Metadata } from "next";
import { headers } from "next/headers";
import { stripHtml } from "@/app/_lib/html";
import { getCanonicalUrl, getLocaleAlternates, seoTitle, seoDescription, getLocaleFromRequestHeaders, type SupportedLocale } from "@/lib/seo";
import { CATEGORY_LABELS, CATEGORY_API_KEYS, getPaginaTematicaBySlug, slugToTitle } from "@/app/_lib/tematica/tematica-helpers";
import { TematicaDetailPage } from "@/app/_lib/tematica/TematicaPageComponents";

export const dynamic = "force-dynamic";
const SLUG = "en-familia";

export async function generateMetadata({ params }: { params: Promise<{ puebloSlug: string; pageSlug: string }> }): Promise<Metadata> {
  const { puebloSlug, pageSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const label = CATEGORY_LABELS[SLUG]?.[locale] ?? CATEGORY_LABELS[SLUG].es;
  const puebloNombre = slugToTitle(puebloSlug);
  const page = await getPaginaTematicaBySlug(puebloSlug, CATEGORY_API_KEYS[SLUG], pageSlug, locale);
  const titulo = page?.titulo ?? slugToTitle(pageSlug);
  const path = `/${SLUG}/${puebloSlug}/${pageSlug}`;
  return {
    title: seoTitle(`${titulo} en ${puebloNombre}`),
    description: seoDescription(page?.resumen ? stripHtml(page.resumen) : `${titulo} — ${label} en ${puebloNombre}. Los Pueblos Más Bonitos de España`),
    alternates: { canonical: getCanonicalUrl(path, locale as SupportedLocale), languages: getLocaleAlternates(path) },
    robots: { index: true, follow: true },
    openGraph: { title: seoTitle(`${titulo} en ${puebloNombre}`), ...(page?.coverUrl ? { images: [{ url: page.coverUrl }] } : {}), type: "article" },
    other: { "article:section": label },
  };
}

export default async function EnFamiliaDetailPage({ params }: { params: Promise<{ puebloSlug: string; pageSlug: string }> }) {
  const { puebloSlug, pageSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  return <TematicaDetailPage slug={SLUG} puebloSlug={puebloSlug} pageSlug={pageSlug} locale={locale} />;
}
