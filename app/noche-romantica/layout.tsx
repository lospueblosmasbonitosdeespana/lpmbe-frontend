import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getCanonicalUrl, getLocaleAlternates, type SupportedLocale } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = '/noche-romantica';
  return {
    title: 'Noche Romántica',
    description: 'Programa y pueblos participantes de la Noche Romántica.',
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
  };
}

export default function NocheRomanticaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
