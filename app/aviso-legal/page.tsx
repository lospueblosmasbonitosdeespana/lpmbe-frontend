import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import LegalPage from '@/app/_components/LegalPage';
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, type SupportedLocale } from '@/lib/seo';

export const revalidate = 60;
export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations('legal');
  const path = '/aviso-legal';
  const title = t('legal');
  const description = t('legalDescription');
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    openGraph: { title, description, url: getCanonicalUrl(path, locale), locale: getOGLocale(locale) },
  };
}

export default function AvisoLegalPage() {
  return <LegalPage staticKey="AVISO_LEGAL" slug="aviso-legal" />;
}
