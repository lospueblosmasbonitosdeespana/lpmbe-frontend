import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getCanonicalUrl, getLocaleAlternates, seoTitle, seoDescription, type SupportedLocale } from '@/lib/seo';

const PRENSA_TITLE: Record<string, string> = {
  es: 'Prensa — Los Pueblos Más Bonitos de España',
  en: 'Press — The Most Beautiful Villages of Spain',
  fr: 'Presse — Les Plus Beaux Villages d\'Espagne',
  de: 'Presse — Die Schönsten Dörfer Spaniens',
  pt: 'Imprensa — As Aldeias Mais Bonitas de Espanha',
  it: 'Stampa — I Borghi Più Belli della Spagna',
  ca: 'Premsa — Els Pobles Més Bonics d\'Espanya',
};

const PRENSA_DESC: Record<string, string> = {
  es: 'Dossier de prensa, notas oficiales y recursos para medios de comunicación sobre Los Pueblos Más Bonitos de España.',
  en: 'Press dossier, official notes and media resources about The Most Beautiful Villages of Spain.',
  fr: 'Dossier de presse, communiqués officiels et ressources médias sur Les Plus Beaux Villages d\'Espagne.',
  de: 'Pressedossier, offizielle Mitteilungen und Medienressourcen über Die Schönsten Dörfer Spaniens.',
  pt: 'Dossier de imprensa, notas oficiais e recursos para os meios de comunicação sobre As Aldeias Mais Bonitas de Espanha.',
  it: 'Dossier stampa, comunicati ufficiali e risorse per i media su I Borghi Più Belli della Spagna.',
  ca: 'Dossier de premsa, notes oficials i recursos per als mitjans de comunicació sobre Els Pobles Més Bonics d\'Espanya.',
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const path = '/prensa';
  const title = seoTitle(PRENSA_TITLE[locale] ?? PRENSA_TITLE.es);
  const description = seoDescription(PRENSA_DESC[locale] ?? PRENSA_DESC.es);
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
  };
}

export default function PrensaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
