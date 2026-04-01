import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import LegalPage from '@/app/_components/LegalPage';
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, type SupportedLocale } from '@/lib/seo';

export const revalidate = 60;
export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations('legal');
  const path = '/privacidad';
  const title = t('privacy');
  const description = t('privacyDescription');
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

export default function PrivacidadPage() {
  return <LegalPage staticKey="PRIVACIDAD" slug="privacidad" />;
}
