import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import {
  getCanonicalUrl, getLocaleAlternates, getOGLocale, seoTitle, seoDescription,
  getLocaleFromRequestHeaders, type SupportedLocale,
} from "@/lib/seo";
import { getNegociosByPuebloSlug, NEGOCIO_TIPO_BY_SLUG, slugToTitle } from "@/app/_lib/club/club-helpers";
import { ClubPuebloPage } from "@/app/_lib/club/ClubPuebloPage";

export const dynamic = "force-dynamic";
const SLUG = "donde-dormir" as const;

export async function generateMetadata({ params }: { params: Promise<{ puebloSlug: string }> }): Promise<Metadata> {
  const { puebloSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const tSeo = await getTranslations("seo");
  const tipo = NEGOCIO_TIPO_BY_SLUG[SLUG]?.[0];
  const { pueblo } = await getNegociosByPuebloSlug(puebloSlug, tipo, locale);
  const puebloNombre = pueblo?.nombre?.trim() || slugToTitle(puebloSlug);
  const hasValidPueblo = Boolean(pueblo);
  const path = `/${SLUG}/${puebloSlug}`;
  const title = seoTitle(tSeo("dondeDormirTitle", { nombre: puebloNombre }));
  const description = seoDescription(tSeo("dondeDormirDesc", { nombre: puebloNombre }));
  return {
    title,
    description,
    alternates: { canonical: getCanonicalUrl(path, locale as SupportedLocale), languages: getLocaleAlternates(path) },
    robots: { index: hasValidPueblo, follow: true },
    openGraph: { title, description, url: getCanonicalUrl(path, locale as SupportedLocale), type: "website", locale: getOGLocale(locale as SupportedLocale) },
  };
}

export default async function DondeDormirPage({ params }: { params: Promise<{ puebloSlug: string }> }) {
  const { puebloSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  return <ClubPuebloPage slug={SLUG} puebloSlug={puebloSlug} locale={locale} />;
}
