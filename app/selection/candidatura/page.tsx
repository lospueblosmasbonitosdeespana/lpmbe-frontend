import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  seoTitle,
  seoDescription,
  type SupportedLocale,
} from "@/lib/seo";
import { CandidaturaForm } from "./CandidaturaForm";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const tSeo = await getTranslations("seo");
  const path = "/selection/candidatura";
  const title = seoTitle(tSeo("selectionCandidaturaTitle"));
  const description = seoDescription(tSeo("selectionCandidaturaDesc"));
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

export default async function CandidaturaPage() {
  const t = await getTranslations("candidatura");
  const tSel = await getTranslations("selection");

  return (
    <main className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">
            {tSel("submitCandidacy")} — Club LPMBE Selection
          </h1>
          <p className="mt-4 text-slate-300 max-w-xl mx-auto">
            {tSel("heroDesc")}
          </p>
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <CandidaturaForm />
      </div>
    </main>
  );
}
