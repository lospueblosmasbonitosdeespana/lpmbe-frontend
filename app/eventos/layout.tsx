import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getCanonicalUrl, getLocaleAlternates, type SupportedLocale } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = '/eventos';
  return {
    title: 'Eventos',
    description: 'Agenda de eventos en Los Pueblos Más Bonitos de España.',
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
  };
}

export default function EventosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
