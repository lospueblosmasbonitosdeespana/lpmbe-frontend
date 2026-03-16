import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getCanonicalUrl, getLocaleAlternates, type SupportedLocale } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = '/articulos';
  return {
    title: 'Artículos',
    description: 'Artículos y reportajes sobre los pueblos de la red.',
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
  };
}

export default function ArticulosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
