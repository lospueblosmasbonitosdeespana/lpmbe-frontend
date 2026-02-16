import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('mapPage');
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-2 text-gray-600">{t('pending')}</p>
    </main>
  );
}























