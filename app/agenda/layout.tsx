import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, type SupportedLocale } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = '/agenda';
  const title = 'Agenda';
  const description = 'Agenda de actividades y eventos de Los Pueblos Más Bonitos de España.';
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale as SupportedLocale),
      locale: getOGLocale(locale as SupportedLocale),
    },
  };
}

export default function AgendaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
