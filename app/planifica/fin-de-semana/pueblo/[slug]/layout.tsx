import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, seoTitle, seoDescription, slugToTitle, type SupportedLocale } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations('seo');
  const name = slugToTitle(slug);
  const path = `/planifica/fin-de-semana/pueblo/${slug}`;
  const title = seoTitle(tSeo('finDeSemanaTitle', { nombre: name }));
  const description = seoDescription(tSeo('finDeSemanaDesc', { nombre: name }));
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
    },
    robots: { index: true, follow: true },
  };
}

export default function PlanificaPuebloLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
