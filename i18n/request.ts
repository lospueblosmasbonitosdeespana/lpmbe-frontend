import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type SupportedLocale } from '@/lib/seo';

const LOCALE_COOKIE = 'NEXT_LOCALE';

export default getRequestConfig(async () => {
  const hdrs = await headers();
  const store = await cookies();
  const headerLocale = hdrs.get('x-current-locale');
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;

  const normalizedHeaderLocale =
    headerLocale && SUPPORTED_LOCALES.includes(headerLocale as SupportedLocale)
      ? (headerLocale as SupportedLocale)
      : null;

  const locale: SupportedLocale =
    normalizedHeaderLocale ??
    (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as SupportedLocale)
      ? (cookieLocale as SupportedLocale)
      : DEFAULT_LOCALE);

  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
