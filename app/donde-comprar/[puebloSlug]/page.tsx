import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import {
  getCanonicalUrl, getLocaleAlternates, getOGLocale, seoTitle, seoDescription,
  getLocaleFromRequestHeaders, type SupportedLocale,
} from "@/lib/seo";
import { slugToTitle } from "@/app/_lib/club/club-helpers";
import { ClubPuebloPage } from "@/app/_lib/club/ClubPuebloPage";

export const dynamic = "force-dynamic";
const SLUG = "donde-comprar" as const;

export async function generateMetadata({ params }: { params: Promise<{ puebloSlug: string }> }): Promise<Metadata> {
  const { puebloSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const tSeo = await getTranslations("seo");
  const puebloNombre = slugToTitle(puebloSlug);
  const path = `/${SLUG}/${puebloSlug}`;
  const title = seoTitle(tSeo("dondeComprarTitle", { nombre: puebloNombre }));
  const description = seoDescription(tSeo("dondeComprarDesc", { nombre: puebloNombre }));
  return {
    title,
    description,
    alternates: { canonical: getCanonicalUrl(path, locale as SupportedLocale), languages: getLocaleAlternates(path) },
    robots: { index: true, follow: true },
    openGraph: { title, description, url: getCanonicalUrl(path, locale as SupportedLocale), type: "website", locale: getOGLocale(locale as SupportedLocale) },
  };
}

export default async function DondeComprarPage({ params }: { params: Promise<{ puebloSlug: string }> }) {
  const { puebloSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  return <ClubPuebloPage slug={SLUG} puebloSlug={puebloSlug} locale={locale} />;
}
