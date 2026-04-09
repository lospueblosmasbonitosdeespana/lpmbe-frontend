import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { getPuebloBySlugFast, getPueblosLite } from "@/lib/api";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoTitle,
  seoDescription,
  type SupportedLocale,
} from "@/lib/seo";
import { MeteoDetailClient } from "./MeteoDetailClient";

export async function generateStaticParams() {
  try {
    const pueblos = await getPueblosLite();
    return pueblos.map((p: any) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const pueblo = await getPuebloBySlugFast(slug, locale);
  const t = await getTranslations("meteoDetailPage");

  const title = pueblo
    ? seoTitle(`${t("title")} — ${pueblo.nombre}`)
    : seoTitle(t("title"));
  const description = pueblo
    ? seoDescription(
        t("metaDescription", { nombre: pueblo.nombre, provincia: pueblo.provincia ?? "" })
      )
    : seoDescription(t("title"));
  const path = `/pueblos/${slug}/meteo`;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      locale: getOGLocale(locale as SupportedLocale),
    },
    robots: { index: true, follow: true },
  };
}

export default async function MeteoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("meteoDetailPage"),
  ]);

  let pueblo: any;
  try {
    pueblo = await getPuebloBySlugFast(slug, locale);
  } catch {
    pueblo = null;
  }
  if (!pueblo) notFound();

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            {t("home")}
          </Link>
          <span className="mx-2">›</span>
          <Link
            href={`/pueblos/${slug}`}
            className="hover:text-foreground transition-colors"
          >
            {pueblo.nombre}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-foreground font-medium">{t("title")}</span>
        </nav>

        <MeteoDetailClient
          puebloId={pueblo.id}
          puebloNombre={pueblo.nombre}
          puebloSlug={slug}
          locale={locale}
        />
      </div>
    </main>
  );
}
