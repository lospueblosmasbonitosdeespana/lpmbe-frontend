import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getPueblosLite } from "@/lib/api";
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, type SupportedLocale } from "@/lib/seo";
import PueblosList from "./PueblosList";

// 🔒 Evita SSG / paths raros
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("seo");
  const path = "/pueblos";
  const title = 'Pueblos de la red';
  const description = t("pueblosListDescription");
  const canonicalUrl = getCanonicalUrl(path, locale);
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
    },
  };
}

type SearchParams = {
  comunidad?: string;
  provincia?: string;
};

async function getPueblos(locale?: string) {
  return getPueblosLite(locale);
}

export default async function PueblosPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const sp = searchParams ? await searchParams : ({} as SearchParams);
  const locale = await getLocale();
  const t = await getTranslations("explore");
  const comunidad = (sp.comunidad ?? "").trim();
  const provincia = (sp.provincia ?? "").trim();

  try {
    const pueblos = await getPueblos(locale);
    return (
      <PueblosList
        pueblos={pueblos}
        initialComunidad={comunidad}
        initialProvincia={provincia}
      />
    );
  } catch {
    return (
      <main style={{ padding: "24px" }}>
        <h1>{t("title")}</h1>
        <p style={{ marginTop: "24px", color: "#d32f2f" }}>
          {t("loadError")}
        </p>
      </main>
    );
  }
}
