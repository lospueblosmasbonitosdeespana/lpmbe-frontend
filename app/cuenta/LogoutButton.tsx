'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function LogoutButton() {
  const t = useTranslations('myAccount');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/entrar');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="mt-10 rounded-md border px-3 py-2"
      onClick={logout}
      disabled={loading}
      type="button"
    >
      {loading ? t('loggingOut') : t('logout')}
    </button>
  );
}

