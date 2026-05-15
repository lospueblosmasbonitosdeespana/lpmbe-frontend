import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getApiUrl } from "@/lib/api";
import {
  getBaseUrl,
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoDescription,
  seoTitle,
  type SupportedLocale,
} from "@/lib/seo";
import NegocioDetail from "@/app/pueblos/[slug]/club/[negocioSlug]/NegocioDetail";
import JsonLd from "@/app/components/seo/JsonLd";
import SelectionPremiumDetail from "@/app/_components/selection/SelectionPremiumDetail";

export const revalidate = 60;

type Recurso = {
  id: number;
  nombre: string;
  tipo: string;
  scope: string;
  slug: string;
  activo?: boolean;
  descripcion?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  comunidad?: string | null;
  telefono?: string | null;
  email?: string | null;
  web?: string | null;
  whatsapp?: string | null;
  lat?: number | null;
  lng?: number | null;
  planNegocio?: string | null;
  landingConfig?: unknown;
  socialLinks?: Record<string, string> | null;
  pueblo?: { id: number; nombre: string; slug: string } | null;
  imagenes?: Array<{ id: number; url: string; alt: string | null; orden: number }>;
  imprescindible?: boolean;
  ratingVerificado?: { rating: number | null; reviews: number | null } | null;
};

async function fetchRecurso(slug: string, locale: string): Promise<Recurso | null> {
  const API_BASE = getApiUrl();
  try {
    const res = await fetch(`${API_BASE}/public/recursos/${slug}?lang=${locale}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations("seo");
  const recurso = await fetchRecurso(slug, locale);
  const name = recurso?.nombre ?? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const loc = recurso?.localidad ?? recurso?.provincia ?? "";
  const path = `/selection/${slug}`;
  const title = seoTitle(tSeo("selectionDetailTitle", { nombre: `${name}${loc ? ` · ${loc}` : ""}` }));
  const description = seoDescription(tSeo("selectionDetailDesc", { nombre: name }));
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
      type: "website",
      ...(recurso?.imagenes?.[0]?.url && {
        images: [{ url: recurso.imagenes[0].url, alt: name }],
      }),
    },
    twitter: {
      card: recurso?.imagenes?.[0]?.url ? "summary_large_image" : "summary",
      title,
      description,
      ...(recurso?.imagenes?.[0]?.url ? { images: [recurso.imagenes[0].url] } : {}),
    },
  };
}

export default async function SelectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations("selection");
  const tTabs = await getTranslations("tabs");
  const tRecursos = await getTranslations("recursos");
  const imprescindibleLabel = tRecursos("imprescindible");
  const recurso = await fetchRecurso(slug, locale);

  if (!recurso || recurso.activo === false) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <h1 className="text-2xl font-bold">{t("notFound")}</h1>
          <p className="mt-2 text-muted-foreground">{t("notFoundDesc")}</p>
          <Link href="/selection" className="mt-4 inline-block text-primary hover:underline">
            {t("backToSelection")}
          </Link>
        </div>
      </main>
    );
  }

  if (recurso.planNegocio === "SELECTION") {
    return <SelectionPremiumDetail recurso={recurso as any} />;
  }

  const homeLabel = tTabs("home");
  const breadcrumbs = [
    { label: homeLabel, href: "/" },
    { label: "Club LPMBE Selection", href: "/selection" },
    { label: recurso.nombre, href: `/selection/${slug}` },
  ];

  const puebloSlug = recurso.pueblo?.slug ?? "selection";

  const base = getBaseUrl();
  const selectionPath = `/selection/${slug}`;
  const selectionUrl = getCanonicalUrl(selectionPath, locale as SupportedLocale);
  const localBusinessLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: recurso.nombre,
    url: selectionUrl,
    ...(recurso.descripcion
      ? { description: seoDescription(recurso.descripcion.replace(/<[^>]+>/g, " "), 300) }
      : {}),
    ...(recurso.imagenes?.[0]?.url ? { image: recurso.imagenes[0].url } : {}),
    ...(recurso.localidad || recurso.provincia
      ? {
          address: {
            "@type": "PostalAddress",
            addressCountry: "ES",
            ...(recurso.localidad ? { addressLocality: recurso.localidad } : {}),
            ...(recurso.provincia ? { addressRegion: recurso.provincia } : {}),
          },
        }
      : {}),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: homeLabel, item: base },
      { "@type": "ListItem", position: 2, name: "Club LPMBE Selection", item: `${base}/selection` },
      { "@type": "ListItem", position: 3, name: recurso.nombre, item: `${base}${selectionPath}` },
    ],
  };

  return (
    <main className="min-h-screen bg-background">
      <JsonLd data={localBusinessLd} />
      <JsonLd data={breadcrumbLd} />
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <nav className="mb-4 flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            {breadcrumbs.map((b, i) => (
              <span key={b.href}>
                {i > 0 && <span className="mx-1">/</span>}
                <Link href={b.href} className="hover:text-foreground">
                  {b.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <NegocioDetail
          recurso={recurso as any}
          puebloSlug={puebloSlug}
          backHref="/selection"
          backLabel="Club LPMBE Selection"
          imprescindibleLabel={imprescindibleLabel}
        />
      </div>
    </main>
  );
}
