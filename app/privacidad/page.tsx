import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import LegalPage from '@/app/_components/LegalPage';
import { getCanonicalUrl, getLocaleAlternates, type SupportedLocale } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = '/privacidad';
  return {
    title: 'Política de privacidad',
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
  };
}

export default function PrivacidadPage() {
  return <LegalPage staticKey="PRIVACIDAD" slug="privacidad" />;
}
