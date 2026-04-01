import type { Metadata } from "next";
import { getApiUrl } from '@/lib/api';
import { getLocale } from 'next-intl/server';
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, seoTitle, seoDescription, type SupportedLocale } from "@/lib/seo";
import SemanaSantaLandingClient from './SemanaSantaLandingClient';

export const revalidate = 60;
const PAGE_TITLE: Record<string, string> = {
  es: "Semana Santa en los pueblos más bonitos",
  en: "Holy Week in the most beautiful villages",
  fr: "Semaine sainte dans les plus beaux villages",
  de: "Karwoche in den schönsten Dörfern",
  pt: "Semana Santa nas aldeias mais bonitas",
  it: "Settimana Santa nei borghi più belli",
  ca: "Setmana Santa als pobles més bonics",
};

const PAGE_DESC: Record<string, string> = {
  es: "Procesiones, horarios y agenda de Semana Santa en los pueblos más bonitos de España. Planifica tu visita.",
  en: "Processions, schedules and Holy Week events in Spain's most beautiful villages. Plan your visit.",
  fr: "Processions, horaires et programme de la Semaine sainte dans les plus beaux villages d'Espagne.",
  de: "Prozessionen, Zeiten und Programm der Karwoche in Spaniens schönsten Dörfern. Planen Sie Ihren Besuch.",
  pt: "Procissões, horários e agenda da Semana Santa nas aldeias mais bonitas de Espanha. Planeie a sua visita.",
  it: "Processioni, orari e programma della Settimana Santa nei borghi più belli della Spagna.",
  ca: "Processons, horaris i agenda de Setmana Santa als pobles més bonics d'Espanya. Planifica la teva visita.",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const path = "/planifica/semana-santa";
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
    },
    robots: { index: true, follow: true },
  };
}

type Item = {
  id: number;
  cartelVerticalUrl: string | null;
  cartelHorizontalUrl: string | null;
  streamUrl: string | null;
  videoUrl: string | null;
  interesTuristico: 'NINGUNO' | 'REGIONAL' | 'NACIONAL' | 'INTERNACIONAL';
  pueblo: {
    nombre: string;
    slug: string;
    provincia: string;
    comunidad: string;
    lat?: number | null;
    lng?: number | null;
    foto_destacada: string | null;
  };
  agenda: Array<{ id: number }>;
  dias: Array<{ id: number }>;
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
    fetch(`${API}/semana-santa/config?lang=${lang}`),
    fetch(`${API}/semana-santa/pueblos?lang=${lang}`),
  ]);
  return {
    config: cfgRes.ok ? await cfgRes.json() : null,
    pueblos: pueblosRes.ok ? await pueblosRes.json() : [],
  };
}

export default async function SemanaSantaLandingPage() {
  const locale = await getLocale();
  const { config, pueblos } = await fetchData(locale);
  return <SemanaSantaLandingClient config={config} pueblos={pueblos} />;
}
