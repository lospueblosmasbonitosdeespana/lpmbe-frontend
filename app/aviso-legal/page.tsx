import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import LegalPage from '@/app/_components/LegalPage';
import { getCanonicalUrl, getLocaleAlternates, type SupportedLocale } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const localeSuffix = locale === 'es' ? '' : ` (${locale.toUpperCase()})`;
  const path = '/aviso-legal';
  return {
    title: `Aviso legal${localeSuffix}`,
    description: `Condiciones legales, titularidad del sitio y terminos de uso de Los Pueblos Mas Bonitos de Espana.${localeSuffix}`,
    alternates: {
      canonical: getCanonicalUrl(path, locale as SupportedLocale),
      languages: getLocaleAlternates(path),
    },
  };
}

export default function AvisoLegalPage() {
  return <LegalPage staticKey="AVISO_LEGAL" slug="aviso-legal" />;
}
