'use client';

import { useState, useMemo } from 'react';

type Pueblo = {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
  provincia?: string | null;
  comunidad?: string | null;
};

type Props = {
  pueblos: Pueblo[];
  visitedIds: Set<number>;
  onMarcarVisitado: (puebloId: number) => Promise<void>;
};

export default function PueblosPorVisitar({
  pueblos,
  visitedIds,
  onMarcarVisitado,
}: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtrar pueblos no visitados
  const pueblosPorVisitar = useMemo(() => {
    return pueblos
      .filter((p) => !visitedIds.has(p.id))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [pueblos, visitedIds]);

  // Filtrar por búsqueda
  const pueblosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return pueblosPorVisitar;
    const term = busqueda.toLowerCase().trim();
    return pueblosPorVisitar.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        (p.provincia && p.provincia.toLowerCase().includes(term)) ||
        (p.comunidad && p.comunidad.toLowerCase().includes(term))
    );
  }, [pueblosPorVisitar, busqueda]);

  const handleMarcar = async (puebloId: number) => {
    setLoadingId(puebloId);
    setError(null);
    try {
      await onMarcarVisitado(puebloId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al marcar visita';
      setError(msg);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">
        Pueblos por visitar ({pueblosPorVisitar.length})
      </h2>

      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, provincia o comunidad..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Lista en 2 columnas */}
      <div className="max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg bg-white">
        {pueblosFiltrados.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {busqueda
              ? 'No se encontraron pueblos con ese criterio'
              : 'Has visitado todos los pueblos'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-px bg-gray-200">
            {pueblosFiltrados.map((pueblo) => (
              <div
                key={pueblo.id}
                className="flex items-center justify-between p-3 bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="font-medium text-gray-900 truncate text-sm">
                    {pueblo.nombre}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {pueblo.provincia}
                  </p>
                </div>
                <button
                  onClick={() => handleMarcar(pueblo.id)}
                  disabled={loadingId === pueblo.id}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {loadingId === pueblo.id ? (
                    <span className="flex items-center gap-1.5">
                      <svg
                        className="animate-spin h-3 w-3"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      ...
                    </span>
                  ) : (
                    'Marcar'
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
