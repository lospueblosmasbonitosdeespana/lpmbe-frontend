'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setLocale } from '@/app/actions/locale';

const LOCALES: { code: string; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
];

type Props = { currentLocale: string; variant?: 'footer' | 'header' };

export function LocaleSwitcher({ currentLocale, variant = 'footer' }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (code: string) => {
    if (code === currentLocale) return;
    startTransition(() => {
      const form = new FormData();
      form.set('locale', code);
      form.set('path', pathname ?? '/');
      setLocale(form).then(() => {
        router.refresh();
      });
    });
  };

  if (variant === 'header') {
    return (
      <div className="relative">
        <select
          value={currentLocale}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isPending}
          className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          aria-label="Idioma"
        >
          {LOCALES.map(({ code, label }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-white/60">Idioma:</span>
      <div className="flex flex-wrap gap-1">
        {LOCALES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => handleChange(code)}
            disabled={isPending}
            className={`rounded px-2 py-1 text-sm transition-colors ${
              currentLocale === code
                ? 'bg-white/20 text-white font-medium'
                : 'text-white/70 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
