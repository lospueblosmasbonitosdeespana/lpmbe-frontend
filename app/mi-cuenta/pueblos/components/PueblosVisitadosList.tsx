'use client';

import { useState } from 'react';
import PuebloVisitadoItem from './PuebloVisitadoItem';

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
};

const ITEMS_PER_PAGE = 15;

export default function PueblosVisitadosList({ items }: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-600 py-8">
        No has visitado ningún pueblo aún.
      </div>
    );
  }

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = items.slice(startIndex, endIndex);

  return (
    <div>
      <ul className="space-y-3">
        {currentItems.map((item) => (
          <PuebloVisitadoItem key={item.puebloId} item={item} />
        ))}
      </ul>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            Anterior
          </button>

          <span className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
