import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const;
const DEFAULT_LOCALE = 'es';

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE)?.value;
  const locale =
    cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as (typeof SUPPORTED_LOCALES)[number])
      ? cookieLocale
      : DEFAULT_LOCALE;

  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
