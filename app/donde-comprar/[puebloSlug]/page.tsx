import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  getCanonicalUrl, getLocaleAlternates, seoTitle, seoDescription,
  getLocaleFromRequestHeaders, type SupportedLocale,
} from "@/lib/seo";
import { CLUB_PAGE_LABELS, CLUB_PAGE_DESCRIPTIONS, slugToTitle } from "@/app/_lib/club/club-helpers";
import { ClubPuebloPage } from "@/app/_lib/club/ClubPuebloPage";

export const dynamic = "force-dynamic";
const SLUG = "donde-comprar" as const;

export async function generateMetadata({ params }: { params: Promise<{ puebloSlug: string }> }): Promise<Metadata> {
  const { puebloSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const label = CLUB_PAGE_LABELS[SLUG]?.[locale] ?? CLUB_PAGE_LABELS[SLUG].es;
  const desc = CLUB_PAGE_DESCRIPTIONS[SLUG]?.[locale] ?? CLUB_PAGE_DESCRIPTIONS[SLUG].es;
  const puebloNombre = slugToTitle(puebloSlug);
  const path = `/${SLUG}/${puebloSlug}`;
  return {
    title: seoTitle(`${label} en ${puebloNombre}`),
    description: seoDescription(`${label} en ${puebloNombre}. Descubre los mejores ${desc}. Los Pueblos Más Bonitos de España.`),
    alternates: { canonical: getCanonicalUrl(path, locale as SupportedLocale), languages: getLocaleAlternates(path) },
    robots: { index: true, follow: true },
    openGraph: { title: seoTitle(`${label} en ${puebloNombre}`), type: "website" },
  };
}

export default async function DondeComprarPage({ params }: { params: Promise<{ puebloSlug: string }> }) {
  const { puebloSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  return <ClubPuebloPage slug={SLUG} puebloSlug={puebloSlug} locale={locale} />;
}
