'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const LOCALE_COOKIE = 'NEXT_LOCALE';
const SUPPORTED = ['es', 'en', 'fr', 'de', 'pt', 'it'] as const;

export async function setLocale(formData: FormData) {
  const locale = formData.get('locale') as string;
  if (!locale || !SUPPORTED.includes(locale as (typeof SUPPORTED)[number])) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, { path: '/', maxAge: 365 * 24 * 60 * 60 });

  const path = (formData.get('path') as string) || '/';
  redirect(path);
}
