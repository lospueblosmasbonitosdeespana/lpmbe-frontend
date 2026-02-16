'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import BandejaNotificaciones from './BandejaNotificaciones';

export default function BandejaPage() {
  const t = useTranslations('notifications');

  return (
    <section className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('centerTitle')}</h1>
        <Link
          href="/mi-cuenta/notificaciones"
          className="text-sm text-blue-600 hover:underline"
        >
          ⚙️ {t('prefsLink')}
        </Link>
      </div>

      <BandejaNotificaciones />
    </section>
  );
}
