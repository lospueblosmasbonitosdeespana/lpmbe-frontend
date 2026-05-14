import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  getCanonicalUrl, getLocaleAlternates, getOGLocale, seoTitle, seoDescription,
  getLocaleFromRequestHeaders, type SupportedLocale,
} from "@/lib/seo";
import {
  CLUB_PAGE_LABELS, getNegocioBySlug, getNegociosByPuebloSlug, NEGOCIO_TIPO_BY_SLUG, slugToTitle,
} from "@/app/_lib/club/club-helpers";
import NegocioDetail from "@/app/pueblos/[slug]/club/[negocioSlug]/NegocioDetail";
import NegocioPremiumDetail from "@/app/_components/negocio/NegocioPremiumDetail";
import RestaurantePremiumDetail from "@/app/_components/restaurante/RestaurantePremiumDetail";
import {
  RESTAURANTE_TRANSLATION_KEYS,
  esRestaurantePremium,
} from "@/app/_components/restaurante/restaurante-translation-keys";
import { buildRestaurantJsonLd } from "@/app/_lib/seo/restaurant-json-ld";

const PREMIUM_TRANSLATION_KEYS = [
  'noPhotos', 'prevImage', 'nextImage', 'goToSlide', 'imprescindible', 'cerradoTemporal',
  'servicesSubtitle', 'servicesTitle', 'aboutSubtitle', 'aboutTitle', 'clubPoints',
  'contactSubtitle', 'contactTitle', 'phone', 'email', 'website', 'bookNow',
  'openingHours', 'closed', 'locationSubtitle', 'locationTitle', 'address',
  'getDirections', 'offersSubtitle', 'offersTitle', 'offersDescription',
  'forMembers', 'featured',
  'becomeMemberTitle', 'becomeMemberDescription', 'joinNow', 'learnMore',
] as const;

export const dynamic = "force-dynamic";
const ROUTE_SLUG = "donde-comer" as const;

export async function generateMetadata({ params }: { params: Promise<{ puebloSlug: string; negocioSlug: string }> }): Promise<Metadata> {
  const { puebloSlug, negocioSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const tSeo = await getTranslations("seo");
  const tipo = NEGOCIO_TIPO_BY_SLUG[ROUTE_SLUG]?.[0];
  const [recurso, negociosPueblo] = await Promise.all([
    getNegocioBySlug(negocioSlug, locale),
    getNegociosByPuebloSlug(puebloSlug, tipo, locale),
  ]);
  const puebloNombre = negociosPueblo.pueblo?.nombre?.trim() || slugToTitle(puebloSlug);
  const negocioNombre = recurso?.nombre?.trim() || slugToTitle(negocioSlug);
  const negocioPerteneceAlPueblo = Boolean(
    recurso && negociosPueblo.negocios.some((n) => (n.slug && n.slug === negocioSlug) || n.id === recurso.id),
  );
  const hasValidNegocio = Boolean(recurso && negociosPueblo.pueblo && negocioPerteneceAlPueblo);
  const path = `/${ROUTE_SLUG}/${puebloSlug}/${negocioSlug}`;
  const title = seoTitle(tSeo("dondeNegocioTitle", { negocio: negocioNombre, pueblo: puebloNombre }));
  const description = seoDescription(tSeo("dondeNegocioDesc", { negocio: negocioNombre, pueblo: puebloNombre }));
  return {
    title,
    description,
    alternates: { canonical: getCanonicalUrl(path, locale as SupportedLocale), languages: getLocaleAlternates(path) },
    robots: { index: hasValidNegocio, follow: true },
    openGraph: { title, description, url: getCanonicalUrl(path, locale as SupportedLocale), type: "website", locale: getOGLocale(locale as SupportedLocale) },
  };
}

export default async function DondeComerDetailPage({ params }: { params: Promise<{ puebloSlug: string; negocioSlug: string }> }) {
  const { puebloSlug, negocioSlug } = await params;
  const h = await headers();
  const locale = getLocaleFromRequestHeaders(h);
  const label = CLUB_PAGE_LABELS[ROUTE_SLUG]?.[locale] ?? CLUB_PAGE_LABELS[ROUTE_SLUG].es;

  const recurso = await getNegocioBySlug(negocioSlug, locale);
  if (!recurso) return notFound();

  const puebloNombre = slugToTitle(puebloSlug);
  const tRecursos = await getTranslations("recursos");
  const imprescindibleLabel = tRecursos("imprescindible");
  const tPremium = await getTranslations("premiumNegocio");

  const isPremium = recurso.planNegocio === "PREMIUM" || recurso.planNegocio === "SELECTION";
  const isRestaurantePremium = esRestaurantePremium(recurso.tipo, recurso.planNegocio);

  if (isRestaurantePremium) {
    const tRest = await getTranslations("premiumRestaurante");
    const translations: Record<string, string> = {};
    for (const key of RESTAURANTE_TRANSLATION_KEYS) {
      translations[key] = tRest(key as any);
    }
    const jsonLd = buildRestaurantJsonLd(recurso as any, `/${ROUTE_SLUG}/${puebloSlug}/${negocioSlug}`);
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <RestaurantePremiumDetail
          recurso={recurso as any}
          backHref={`/${ROUTE_SLUG}/${puebloSlug}`}
          backLabel={label}
          translations={translations}
        />
      </>
    );
  }

  if (isPremium) {
    const translations: Record<string, string> = {};
    for (const key of PREMIUM_TRANSLATION_KEYS) {
      translations[key] = tPremium(key as any);
    }
    return (
      <NegocioPremiumDetail
        recurso={recurso as any}
        puebloSlug={puebloSlug}
        backHref={`/${ROUTE_SLUG}/${puebloSlug}`}
        backLabel={label}
        translations={translations}
      />
    );
  }

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
        <NegocioDetail
          recurso={recurso as any}
          puebloSlug={puebloSlug}
          backHref={`/${ROUTE_SLUG}/${puebloSlug}`}
          backLabel={label}
          imprescindibleLabel={imprescindibleLabel}
        />
      </div>
    </main>
  );
}
