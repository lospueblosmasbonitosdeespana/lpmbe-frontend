import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getCanonicalUrl, getLocaleAlternates, type SupportedLocale } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = '/entrar';
  return {
    title: 'Entrar',
    description: 'Accede a tu cuenta de Los Pueblos Más Bonitos de España.',
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
  };
}

export default function EntrarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
