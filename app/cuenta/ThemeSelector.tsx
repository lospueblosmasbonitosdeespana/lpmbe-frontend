'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

type ThemeValue = 'light' | 'dark' | 'system';

export default function ThemeSelector() {
  const t = useTranslations('theme');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const options: { value: ThemeValue; label: string; icon: React.ReactNode }[] = [
    { value: 'system', label: t('system'), icon: <Monitor className="h-4 w-4" /> },
    { value: 'light', label: t('light'), icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: t('dark'), icon: <Moon className="h-4 w-4" /> },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-sm font-medium text-foreground">{t('label')}</span>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex rounded-lg border border-border bg-muted/50 p-1">
          {options.map((opt) => {
            const isActive = (theme ?? 'system') === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={opt.label}
              >
                {opt.icon}
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
