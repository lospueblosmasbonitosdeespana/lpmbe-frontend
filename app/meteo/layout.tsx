import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getCanonicalUrl, getLocaleAlternates, type SupportedLocale } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = '/meteo';
  return {
    title: 'Meteo',
    description: 'Consulta la previsión del tiempo en los pueblos de la red.',
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
  };
}

export default function MeteoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
