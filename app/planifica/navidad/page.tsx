import type { Metadata } from "next";
import { getApiUrl } from '@/lib/api';
import { getLocale } from 'next-intl/server';
import { getCanonicalUrl, getDefaultOgImage, getLocaleAlternates, getOGLocale, seoTitle, seoDescription, type SupportedLocale } from "@/lib/seo";
import NavidadLandingClient from './NavidadLandingClient';

export const revalidate = 60;
const PAGE_TITLE: Record<string, string> = {
  es: "Planifica tu Navidad en los pueblos más bonitos",
  en: "Plan your Christmas in the most beautiful villages",
  fr: "Planifiez votre Noël dans les plus beaux villages",
  de: "Planen Sie Ihre Weihnachten in den schönsten Dörfern",
  pt: "Planeie o seu Natal nas aldeias mais bonitas",
  it: "Pianifica il tuo Natale nei borghi più belli",
  ca: "Planifica el teu Nadal als pobles més bonics",
};

const PAGE_DESC: Record<string, string> = {
  es: "Descubre los eventos y actividades navideñas en los pueblos más bonitos de España. Belenes, mercadillos y tradiciones.",
  en: "Discover Christmas events and activities in Spain's most beautiful villages. Nativity scenes, markets and traditions.",
  fr: "Découvrez les événements de Noël dans les plus beaux villages d'Espagne. Crèches, marchés et traditions.",
  de: "Entdecken Sie Weihnachtsveranstaltungen in Spaniens schönsten Dörfern. Krippen, Märkte und Traditionen.",
  pt: "Descubra os eventos de Natal nas aldeias mais bonitas de Espanha. Presépios, mercados e tradições.",
  it: "Scopri gli eventi natalizi nei borghi più belli della Spagna. Presepi, mercatini e tradizioni.",
  ca: "Descobreix els esdeveniments nadalencs als pobles més bonics d'Espanya. Pessebres, mercats i tradicions.",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const path = "/planifica/navidad";
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

type Evento = {
  id: number;
  tipo: string;
  publicoObjetivo: string;
  titulo: string;
  fechaInicio: string;
};

type Item = {
  id: number;
  cartelUrl: string | null;
  streamUrl: string | null;
  videoUrl: string | null;
  interesTuristico: string;
  pueblo: {
    nombre: string;
    slug: string;
    provincia: string;
    comunidad: string;
    lat?: number | null;
    lng?: number | null;
    foto_destacada: string | null;
  };
  eventos: Evento[];
};

type Config = {
  titulo: string;
  subtitulo: string | null;
  anio: number;
  activo: boolean;
};

async function fetchData(locale: string): Promise<{ config: Config | null; pueblos: Item[] }> {
  const API = getApiUrl();
  const lang = encodeURIComponent(locale);
  const [cfgRes, pueblosRes] = await Promise.all([
    fetch(`${API}/navidad/config?lang=${lang}`),
    fetch(`${API}/navidad/pueblos?lang=${lang}`),
  ]);
  return {
    config: cfgRes.ok ? await cfgRes.json() : null,
    pueblos: pueblosRes.ok ? await pueblosRes.json() : [],
  };
}

export default async function NavidadLandingPage() {
  const locale = await getLocale();
  const { config, pueblos } = await fetchData(locale);
  return <NavidadLandingClient config={config} pueblos={pueblos} />;
}
