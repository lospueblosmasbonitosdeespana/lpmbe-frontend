import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getCanonicalUrl, getDefaultOgImage, getLocaleAlternates, getOGLocale, seoTitle, seoDescription, type SupportedLocale } from "@/lib/seo";

const PAGE_TITLE: Record<string, string> = {
  es: "Planifica tu fin de semana",
  en: "Plan your weekend",
  fr: "Planifiez votre week-end",
  de: "Planen Sie Ihr Wochenende",
  pt: "Planeie o seu fim de semana",
  it: "Pianifica il tuo fine settimana",
  ca: "Planifica el teu cap de setmana",
};

const PAGE_DESC: Record<string, string> = {
  es: "Eventos este fin de semana en los pueblos más bonitos de España, organizados por región. Planifica tu escapada.",
  en: "Events this weekend in the most beautiful villages of Spain, organised by region. Plan your getaway.",
  fr: "Événements ce week-end dans les plus beaux villages d'Espagne, classés par région. Planifiez votre escapade.",
  de: "Veranstaltungen am Wochenende in Spaniens schönsten Dörfern, nach Region sortiert. Planen Sie Ihren Ausflug.",
  pt: "Eventos neste fim de semana nas aldeias mais bonitas de Espanha, organizados por região. Planeie a sua escapada.",
  it: "Eventi questo fine settimana nei borghi più belli della Spagna, per regione. Pianifica la tua fuga.",
  ca: "Esdeveniments aquest cap de setmana als pobles més bonics d'Espanya, per regió. Planifica la teva escapada.",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const path = "/planifica/fin-de-semana";
  const title = seoTitle(PAGE_TITLE[locale] ?? PAGE_TITLE.es);
  const description = seoDescription(PAGE_DESC[locale] ?? PAGE_DESC.es);
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
      images: [{ url: getDefaultOgImage(), alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [getDefaultOgImage()],
    },
    robots: { index: true, follow: true },
  };
}

export default function PlanificaFinDeSemanaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
