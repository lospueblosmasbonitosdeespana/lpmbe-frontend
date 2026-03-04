import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getPueblosLite } from "@/lib/api";
import { getCanonicalUrl, getLocaleAlternates, SITE_NAME } from "@/lib/seo";
import PueblosList from "./PueblosList";

// 🔒 Evita SSG / paths raros
export const dynamic = "force-dynamic";

const LIST_DESCRIPTION =
  "Listado de los pueblos más bonitos de España por comunidad y provincia. Descubre destinos, mapas y planifica tu visita.";

export async function generateMetadata(): Promise<Metadata> {
  const path = "/pueblos";
  return {
    title: "Pueblos más bonitos de España – Listado por provincia y comunidad",
    description: LIST_DESCRIPTION,
    alternates: {
      canonical: getCanonicalUrl(path),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title: "Pueblos más bonitos de España – Listado | " + SITE_NAME,
      description: LIST_DESCRIPTION,
      url: getCanonicalUrl(path),
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
