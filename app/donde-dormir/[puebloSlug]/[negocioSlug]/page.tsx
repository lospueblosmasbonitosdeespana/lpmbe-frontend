import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCanonicalUrl, getLocaleAlternates, seoTitle, seoDescription,
  getLocaleFromRequestHeaders, type SupportedLocale,
} from "@/lib/seo";
import {
  CLUB_PAGE_LABELS, getNegocioBySlug, slugToTitle,
} from "@/app/_lib/club/club-helpers";
import NegocioDetail from "@/app/pueblos/[slug]/club/[negocioSlug]/NegocioDetail";

export const dynamic = "force-dynamic";
const ROUTE_SLUG = "donde-dormir" as const;

export async function generateMetadata({ params }: { params: Promise<{ puebloSlug: string; negocioSlug: string }> }): Promise<Metadata> {
  const { puebloSlug, negocioSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const label = CLUB_PAGE_LABELS[ROUTE_SLUG]?.[locale] ?? CLUB_PAGE_LABELS[ROUTE_SLUG].es;
  const negocioNombre = slugToTitle(negocioSlug);
  const puebloNombre = slugToTitle(puebloSlug);
  const path = `/${ROUTE_SLUG}/${puebloSlug}/${negocioSlug}`;
  return {
    title: seoTitle(`${negocioNombre} - ${label} en ${puebloNombre}`),
    description: seoDescription(`${negocioNombre} en ${puebloNombre}. ${label}. Los Pueblos Más Bonitos de España.`),
    alternates: { canonical: getCanonicalUrl(path, locale as SupportedLocale), languages: getLocaleAlternates(path) },
    robots: { index: true, follow: true },
    openGraph: { title: seoTitle(`${negocioNombre} - ${label} en ${puebloNombre}`), type: "website" },
  };
}

export default async function DondeDormirDetailPage({ params }: { params: Promise<{ puebloSlug: string; negocioSlug: string }> }) {
  const { puebloSlug, negocioSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const label = CLUB_PAGE_LABELS[ROUTE_SLUG]?.[locale] ?? CLUB_PAGE_LABELS[ROUTE_SLUG].es;

  const recurso = await getNegocioBySlug(negocioSlug, locale);
  if (!recurso) return notFound();

  const puebloNombre = slugToTitle(puebloSlug);

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <Link href="/pueblos" className="hover:text-foreground">Pueblos</Link>
            <span className="mx-1">/</span>
            <Link href={`/pueblos/${puebloSlug}`} className="hover:text-foreground">{puebloNombre}</Link>
            <span className="mx-1">/</span>
            <Link href={`/${ROUTE_SLUG}/${puebloSlug}`} className="hover:text-foreground">{label}</Link>
            <span className="mx-1">/</span>
            <span className="text-foreground">{recurso.nombre}</span>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <NegocioDetail recurso={recurso as any} puebloSlug={puebloSlug} backHref={`/${ROUTE_SLUG}/${puebloSlug}`} backLabel={label} />
      </div>
    </main>
  );
}
