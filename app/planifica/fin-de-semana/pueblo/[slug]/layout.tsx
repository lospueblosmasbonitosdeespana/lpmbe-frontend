import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, seoTitle, seoDescription, slugToTitle, type SupportedLocale } from "@/lib/seo";

const DESC_TEMPLATE: Record<string, string> = {
  es: "Eventos este fin de semana en {name}. Planifica tu escapada.",
  en: "Events this weekend in {name}. Plan your getaway.",
  fr: "Événements ce week-end à {name}. Planifiez votre escapade.",
  de: "Veranstaltungen am Wochenende in {name}. Planen Sie Ihren Ausflug.",
  pt: "Eventos neste fim de semana em {name}. Planeie a sua escapada.",
  it: "Eventi questo fine settimana a {name}. Pianifica la tua fuga.",
  ca: "Esdeveniments aquest cap de setmana a {name}. Planifica la teva escapada.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = (await getLocale()) as SupportedLocale;
  const name = slugToTitle(slug);
  const path = `/planifica/fin-de-semana/pueblo/${slug}`;
  const title = seoTitle(`Fin de semana en ${name}`);
  const descTemplate = DESC_TEMPLATE[locale] ?? DESC_TEMPLATE.es;
  const description = seoDescription(descTemplate.replace("{name}", name));
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
