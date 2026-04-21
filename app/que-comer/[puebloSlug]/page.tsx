import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getLocaleFromRequestHeaders } from "@/lib/seo";
import {
  buildTematicaListMetadata,
  CATEGORY_API_KEYS,
  getPaginasTematicasByPuebloWithEsFallback,
  slugify,
  slugToTitle,
} from "@/app/_lib/tematica/tematica-helpers";
import { TematicaListPageUI, TematicaEmptyUI } from "@/app/_lib/tematica/TematicaPageComponents";

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
  return buildTematicaListMetadata({
    slug: URL_SLUG,
    puebloSlug,
    locale,
    titleText: tSeo("queComerTitle", { nombre: puebloNombre }),
    descriptionText: tSeo("queComerDesc", { nombre: puebloNombre }),
    pages,
  });
}

export default async function QueComerListPage({ params }: { params: Promise<{ puebloSlug: string }> }) {
  const { puebloSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const pages = await getPaginasTematicasByPuebloWithEsFallback(puebloSlug, CATEGORY_API_KEYS[SLUG], locale);
  if (!pages.length) return <TematicaEmptyUI slug={URL_SLUG} puebloSlug={puebloSlug} locale={locale} />;
  return <TematicaListPageUI slug={URL_SLUG} puebloSlug={puebloSlug} locale={locale} pages={pages} slugify={slugify} />;
}
