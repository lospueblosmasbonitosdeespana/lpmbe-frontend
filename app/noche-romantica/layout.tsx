import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getCanonicalUrl, getDefaultOgImage, getLocaleAlternates, getOGLocale, seoTitle, seoDescription, type SupportedLocale } from '@/lib/seo';

const PAGE_TITLE: Record<string, string> = {
  es: 'La Noche Romántica en los pueblos más bonitos de España',
  en: 'La Noche Romántica in Spain\'s most beautiful villages',
  fr: 'La Noche Romántica dans les plus beaux villages d\'Espagne',
  de: 'La Noche Romántica in Spaniens schönsten Dörfern',
  pt: 'La Noche Romántica nas aldeias mais bonitas de Espanha',
  it: 'La Noche Romántica nei borghi più belli della Spagna',
  ca: 'La Noche Romántica als pobles més bonics d\'Espanya',
};

const PAGE_DESC: Record<string, string> = {
  es: 'Descubre La Noche Romántica: el evento más especial del año en los pueblos más bonitos de España. Programa de actividades, pueblos participantes, restaurantes y alojamientos.',
  en: 'Discover La Noche Romántica: the most special event of the year in Spain\'s most beautiful villages. Activities, participating villages, restaurants and accommodation.',
  fr: 'Découvrez La Noche Romántica : l\'événement le plus spécial de l\'année dans les plus beaux villages d\'Espagne. Activités, villages participants, restaurants et hébergements.',
  de: 'Entdecken Sie La Noche Romántica: das besonderste Ereignis des Jahres in Spaniens schönsten Dörfern. Aktivitäten, teilnehmende Dörfer, Restaurants und Unterkünfte.',
  pt: 'Descubra La Noche Romántica: o evento mais especial do ano nas aldeias mais bonitas de Espanha. Atividades, aldeias participantes, restaurantes e alojamentos.',
  it: 'Scopri La Noche Romántica: l\'evento più speciale dell\'anno nei borghi più belli della Spagna. Attività, borghi partecipanti, ristoranti e alloggi.',
  ca: 'Descobreix La Noche Romántica: l\'esdeveniment més especial de l\'any als pobles més bonics d\'Espanya. Activitats, pobles participants, restaurants i allotjaments.',
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const path = '/noche-romantica';
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
      type: 'website',
      images: [{ url: getDefaultOgImage(), alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [getDefaultOgImage()],
    },
    robots: { index: true, follow: true },
  };
}

export default function NocheRomanticaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
