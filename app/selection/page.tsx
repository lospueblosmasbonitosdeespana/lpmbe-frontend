import Link from "next/link";
import type { Metadata } from "next";
import {
  getBaseUrl,
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoTitle,
  seoDescription,
  type SupportedLocale,
} from "@/lib/seo";
import { getLocale, getTranslations } from "next-intl/server";
import { getApiUrl } from "@/lib/api";
import { SelectionGrid } from "./SelectionGrid";
import JsonLd from "@/app/components/seo/JsonLd";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations("seo");
  const path = "/selection";
  const title = seoTitle(tSeo("selectionTitle"));
  const description = seoDescription(tSeo("selectionDesc"));

  let ogImage: string | null = null;
  try {
    const negocios = await fetchSelectionNegocios(locale);
    ogImage =
      negocios?.find((n: { imagenes?: Array<{ url?: string }> }) => n?.imagenes?.[0]?.url)
        ?.imagenes?.[0]?.url ?? null;
  } catch {
    ogImage = null;
  }
  const finalOgImage = ogImage ?? `${getBaseUrl()}/brand/logo-lpbe-1.png`;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
      type: "website",
      images: [{ url: finalOgImage, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [finalOgImage],
    },
    robots: { index: true, follow: true },
  };
}

async function fetchSelectionNegocios(locale: string) {
  try {
    const res = await fetch(`${getApiUrl()}/public/recursos/selection?lang=${locale}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function SelectionPage() {
  const locale = await getLocale();
  const t = await getTranslations("selection");
  const tSeo = await getTranslations("seo");
  const tRecursos = await getTranslations("recursos");
  const imprescindibleLabel = tRecursos("imprescindible");
  const negocios = await fetchSelectionNegocios(locale);

  const base = getBaseUrl();
  const pageUrl = getCanonicalUrl("/selection", locale as SupportedLocale);
  const collectionLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seoTitle(tSeo("selectionTitle")),
    description: seoDescription(tSeo("selectionDesc")),
    url: pageUrl,
    inLanguage: locale,
    isPartOf: {
      "@type": "WebSite",
      name: "Los Pueblos Más Bonitos de España",
      url: base,
    },
    ...(Array.isArray(negocios) && negocios.length > 0
      ? {
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: negocios.length,
            itemListElement: negocios.slice(0, 100).map((n: any, i: number) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${base}/selection/${n.slug}`,
              name: n.nombre,
              ...(n.imagenes?.[0]?.url ? { image: n.imagenes[0].url } : {}),
            })),
          },
        }
      : {}),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: base },
      { "@type": "ListItem", position: 2, name: "Club LPMBE Selection", item: pageUrl },
    ],
  };

  return (
    <main className="min-h-screen bg-background">
      <JsonLd data={collectionLd} />
      <JsonLd data={breadcrumbLd} />
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[url('/images/selection-pattern.svg')] opacity-5" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <svg className="h-10 w-10 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <h1 className="text-4xl font-bold sm:text-5xl tracking-tight">
              {t("heroTitle")}
            </h1>
          </div>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            {t("heroSubtitle")}
          </p>
          <p className="mt-4 text-sm text-slate-400 max-w-xl mx-auto">
            {t("heroDesc")}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700 mb-4">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground">{t("rigorousTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("rigorousDesc")}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mb-4">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground">{t("allSpainTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("allSpainDesc")}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-700 mb-4">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground">{t("benefitsTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("benefitsDesc")}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-16">
        {negocios.length > 0 ? (
          <>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {t("ourEstablishments")}
            </h2>
            <SelectionGrid negocios={negocios} imprescindibleLabel={imprescindibleLabel} />
          </>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-slate-700">{t("comingSoon")}</h3>
            <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
              {t("comingSoonDesc")}
            </p>
            <Link
              href="/selection/candidatura"
              className="mt-6 inline-block rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              {t("submitCandidacy")}
            </Link>
          </div>
        )}
      </div>

      <div className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            {t("ctaTitle")}
          </h2>
          <p className="mt-4 text-slate-300 max-w-xl mx-auto">
            {t("ctaDesc")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/selection/candidatura"
              className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-white hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25"
            >
              {t("submitCandidacy")}
            </Link>
            <Link
              href="/para-negocios"
              className="rounded-lg border border-slate-500 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              {t("viewPlans")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
