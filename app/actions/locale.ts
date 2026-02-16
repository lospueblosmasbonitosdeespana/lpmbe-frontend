'use server';

import { cookies } from 'next/headers';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const SUPPORTED = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const;

export async function setLocale(formData: FormData) {
  const locale = formData.get('locale') as string;
  if (!locale || !SUPPORTED.includes(locale as (typeof SUPPORTED)[number])) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  // No redirect: el cliente hace router.refresh() para re-renderizar con el nuevo locale
}
