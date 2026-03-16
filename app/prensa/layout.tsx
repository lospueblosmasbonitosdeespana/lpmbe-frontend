import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { getCanonicalUrl, getLocaleAlternates, type SupportedLocale } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = '/prensa';
  return {
    title: 'Prensa',
    description: 'Dossier de prensa y recursos para medios.',
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
  };
}

export default function PrensaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
