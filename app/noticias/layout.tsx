import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getCanonicalUrl, getLocaleAlternates, type SupportedLocale } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = '/noticias';
  return {
    title: 'Noticias',
    description: 'Noticias de la red de Los Pueblos Más Bonitos de España.',
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
  };
}

export default function NoticiasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
