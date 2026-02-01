'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  puebloId: number;
  initialRating: number | null;
  onRatingSaved?: (puebloId: number, rating: number) => void;
};

export default function RatingSelector({ puebloId, initialRating, onRatingSaved }: Props) {
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
        setError(`Error al guardar valoración: ${text}`);
        return;
      }

      onRatingSaved?.(puebloId, selected);
      setIsOpen(false);
      router.refresh();
    } catch (e: any) {
      setError(`Error al guardar valoración: ${e?.message ?? String(e)}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm">
        {initialRating ? (
          <span>Valoración: {initialRating}</span>
        ) : (
          <span>Sin valoración</span>
        )}{' '}
        <button
          type="button"
          className="underline"
          onClick={() => {
            setError(null);
            setIsOpen((v) => !v);
          }}
        >
          {initialRating ? 'Editar valoración' : 'Valorar'}
        </button>
      </div>

      {isOpen && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`px-3 py-2 border rounded ${selected === n ? 'bg-gray-200' : ''}`}
                onClick={() => setSelected(n)}
                disabled={isSaving}
              >
                {n}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="px-4 py-2 border rounded"
            onClick={handleSave}
            disabled={isSaving || selected < 1 || selected > 5}
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>

          <button
            type="button"
            className="px-4 py-2 border rounded"
            onClick={() => setIsOpen(false)}
            disabled={isSaving}
          >
            Cancelar
          </button>

          {error && <p className="w-full text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
