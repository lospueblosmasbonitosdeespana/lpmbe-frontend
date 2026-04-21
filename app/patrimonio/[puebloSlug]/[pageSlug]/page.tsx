import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { stripHtml } from "@/app/_lib/html";
import { getLocaleFromRequestHeaders } from "@/lib/seo";
import { CATEGORY_LABELS, CATEGORY_API_KEYS, getPaginaTematicaBySlug, slugToTitle, buildTematicaDetailMetadata } from "@/app/_lib/tematica/tematica-helpers";
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
  return buildTematicaDetailMetadata({
    slug: SLUG,
    puebloSlug,
    pageSlug,
    locale,
    titleText: tSeo("tematicaDetalleTitle", { titulo, pueblo: puebloNombre }),
    descriptionText: page?.resumen ? stripHtml(page.resumen) : tSeo("tematicaDetalleDesc", { titulo, pueblo: puebloNombre }),
    coverUrl: page?.coverUrl ?? null,
    hasValidContent,
    articleSection: label,
  });
}

export default async function PatrimonioDetailPage({ params }: { params: Promise<{ puebloSlug: string; pageSlug: string }> }) {
  const { puebloSlug, pageSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  return <TematicaDetailPage slug={SLUG} puebloSlug={puebloSlug} pageSlug={pageSlug} locale={locale} />;
}
