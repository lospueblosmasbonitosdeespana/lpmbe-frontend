import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/seo';

const LOCALE_COOKIE = 'NEXT_LOCALE';

export default getRequestConfig(async () => {
  // SEO: prioridad a ?lang= (middleware lo pasa como x-next-locale) para que crawlers indexen la URL correcta
  const h = await headers();
  const headerLocale = h.get('x-next-locale');
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale =
    (headerLocale && SUPPORTED_LOCALES.includes(headerLocale as (typeof SUPPORTED_LOCALES)[number])
      ? headerLocale
      : cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as (typeof SUPPORTED_LOCALES)[number])
        ? cookieLocale
        : DEFAULT_LOCALE) as (typeof SUPPORTED_LOCALES)[number];

  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
