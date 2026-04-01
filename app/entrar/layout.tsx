import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, type SupportedLocale } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = '/entrar';
  const title = 'Iniciar sesión';
  const description = 'Accede a tu cuenta de Los Pueblos Más Bonitos de España.';
  return {
    title,
    description,
    robots: {
      index: false,
      follow: true,
    },
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

export default function EntrarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
