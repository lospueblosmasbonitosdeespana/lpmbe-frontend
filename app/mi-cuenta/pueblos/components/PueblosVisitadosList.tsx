'use client';

import { useState } from 'react';
import PuebloVisitadoItem from './PuebloVisitadoItem';
import { Caption } from '@/app/components/ui/typography';

type PuebloVisitado = {
  puebloId: number;
  pueblo: {
    id: number;
    nombre: string;
    slug: string;
    provincia: string;
    comunidad: string;
    foto_destacada: string | null;
  };
  origen: 'GPS' | 'MANUAL';
  ultima_fecha: string;
  rating?: number | null;
};

type Props = {
  items: PuebloVisitado[];
  onRatingSaved?: (puebloId: number, rating: number) => void;
};

const ITEMS_PER_PAGE = 15;

export default function PueblosVisitadosList({ items, onRatingSaved }: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <Caption className="text-muted-foreground">
          No has visitado ningún pueblo aún.
        </Caption>
      </div>
    );
  }

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = items.slice(startIndex, endIndex);

  return (
    <div>
      <ul className="divide-y divide-border">
        {currentItems.map((item) => (
          <PuebloVisitadoItem
            key={item.puebloId}
            item={item}
            onRatingSaved={onRatingSaved}
          />
        ))}
      </ul>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>

          <Caption>
            Página {currentPage} de {totalPages}
          </Caption>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
