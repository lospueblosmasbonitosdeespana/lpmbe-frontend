import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import LegalPage from '@/app/_components/LegalPage';
import { getCanonicalUrl, getLocaleAlternates, getOGLocale, type SupportedLocale } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations('legal');
  const path = '/cookies';
  const title = t('cookies');
  const description = t('cookiesDescription');
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

export default function CookiesPage() {
  return <LegalPage staticKey="COOKIES" slug="cookies" />;
}
