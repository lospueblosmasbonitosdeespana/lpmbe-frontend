import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  getCanonicalUrl,
  getLocaleAlternates,
  getOGLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from '@/lib/seo';

const APP_STORE_URL =
  'https://apps.apple.com/es/app/los-pueblos-m%C3%A1s-bonitos-de-esp/id6755147967';
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=app.rork.pueblos_bonitos_app';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations({ locale, namespace: 'appPage' });
  const path = '/app/descargar';
  const title = t('downloadTitle');
  const description = t('downloadDescription');
  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, locale),
      languages: getLocaleAlternates(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, locale),
      locale: getOGLocale(locale),
    },
  };
}

function detectPlatform(userAgent: string): 'ios' | 'android' | 'other' {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'other';
}

export default async function AppDownloadRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const cookieLocale = await getLocale();
  const locale: SupportedLocale =
    resolvedSearchParams?.lang &&
    SUPPORTED_LOCALES.includes(resolvedSearchParams.lang as SupportedLocale)
      ? (resolvedSearchParams.lang as SupportedLocale)
      : (cookieLocale as SupportedLocale);
  const t = await getTranslations({ locale, namespace: 'appPage' });

  const h = await headers();
  const userAgent = h.get('user-agent') ?? '';
  const platform = detectPlatform(userAgent);

  if (platform === 'ios') redirect(APP_STORE_URL);
  if (platform === 'android') redirect(PLAY_STORE_URL);

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-semibold">{t('downloadTitle')}</h1>
      <p className="mt-3 text-muted-foreground">
        {t('downloadDescription')}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <a
          href={APP_STORE_URL}
          className="rounded-lg bg-black px-4 py-3 text-center text-white"
        >
          {t('downloadAppStore')}
        </a>
        <a
          href={PLAY_STORE_URL}
          className="rounded-lg bg-primary px-4 py-3 text-center text-primary-foreground"
        >
          {t('downloadGooglePlay')}
        </a>
      </div>
    </main>
  );
}
