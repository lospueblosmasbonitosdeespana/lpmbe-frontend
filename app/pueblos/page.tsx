import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { getPueblosLite, getPuebloMainPhoto } from "@/lib/api";
import { getBaseUrl, getCanonicalUrl, getLocaleAlternates, getOGLocale, type SupportedLocale } from "@/lib/seo";
import PueblosList from "./PueblosList";

// 🔒 Evita SSG / paths raros
export const dynamic = "force-dynamic";

const PUEBLOS_TITLE: Record<string, string> = {
  es: 'Los Pueblos Más Bonitos de España | Listado completo',
  en: 'The Most Beautiful Villages in Spain | Complete list',
  fr: 'Les Plus Beaux Villages d\'Espagne | Liste complète',
  de: 'Die Schönsten Dörfer Spaniens | Vollständige Liste',
  pt: 'As Aldeias Mais Bonitas de Espanha | Lista completa',
  it: 'I Borghi Più Belli della Spagna | Elenco completo',
  ca: 'Els Pobles Més Bonics d\'Espanya | Llista completa',
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("seo");
  const path = "/pueblos";
  const title = PUEBLOS_TITLE[locale] ?? PUEBLOS_TITLE.es;
  const description = t("pueblosListDescription");
  const canonicalUrl = getCanonicalUrl(path, locale);

  // Imagen OG: primera foto disponible del listado de pueblos (editorial, apta
  // para redes sociales). Fallback al logo de marca si no hay ninguna.
  const baseUrl = getBaseUrl();
  let ogImage: string | null = null;
  try {
    const pueblos = await getPueblosLite(locale);
    for (const p of pueblos ?? []) {
      const photo = getPuebloMainPhoto(p);
      if (photo) {
        ogImage = photo;
        break;
      }
    }
  } catch {
    ogImage = null;
  }
  const finalOgImage = ogImage ?? `${baseUrl}/brand/logo-lpbe-1.png`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
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
  };
}

type SearchParams = {
  comunidad?: string;
  provincia?: string;
  /** Búsqueda libre (usada por el sitelinks searchbox de Google y enlaces externos). */
  q?: string;
  /** Alias de `q`, coincide con el endpoint `/pueblos?search=` del backend. */
  search?: string;
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
  const initialSearchTerm = (sp.q ?? sp.search ?? "").trim();

  try {
    const pueblos = await getPueblos(locale);
    return (
      <PueblosList
        pueblos={pueblos}
        initialComunidad={comunidad}
        initialProvincia={provincia}
        initialSearchTerm={initialSearchTerm}
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
