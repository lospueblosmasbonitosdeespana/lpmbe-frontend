'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

type Props = {
  puebloId: number;
  initialRating: number | null;
  onRatingSaved?: (puebloId: number, rating: number) => void;
};

export default function RatingSelector({ puebloId, initialRating, onRatingSaved }: Props) {
  const t = useTranslations('visitedVillages');
  const router = useRouter();
  const [selected, setSelected] = useState<number>(initialRating ?? 0);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    try {
      setIsSaving(true);
      setError(null);

      const res = await fetch('/api/valoraciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body: JSON.stringify({ puebloId, rating: selected }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(`${t('ratingError')} ${text}`);
        return;
      }

      onRatingSaved?.(puebloId, selected);
      setIsOpen(false);
      router.refresh();
    } catch (e: any) {
      setError(`${t('ratingError')} ${e?.message ?? String(e)}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm">
        {initialRating ? (
          <span className="text-muted-foreground">{t('rating')}: {initialRating}</span>
        ) : (
          <span className="text-muted-foreground">{t('noRating')}</span>
        )}{' '}
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => {
            setError(null);
            setIsOpen((v) => !v);
          }}
        >
          {initialRating ? t('editRating') : t('rate')}
        </button>
      </div>

      {isOpen && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  selected === n
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background hover:bg-accent'
                }`}
                onClick={() => setSelected(n)}
                disabled={isSaving}
              >
                {n}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
            onClick={handleSave}
            disabled={isSaving || selected < 1 || selected > 5}
          >
            {isSaving ? t('savingRating') : t('saveRating')}
          </button>

          <button
            type="button"
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
            onClick={() => setIsOpen(false)}
            disabled={isSaving}
          >
            {t('cancelRating')}
          </button>

          {error && <p className="w-full text-sm text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
