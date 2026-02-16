'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { getComunidadFlagSrc } from '@/lib/flags';
import { Title, Caption } from '@/app/components/ui/typography';

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
  const t = useTranslations('visitedVillages');
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
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <Title size="lg" className="mb-4">
        {t('toVisit')} ({pueblosPorVisitar.length})
      </Title>

      {/* Buscador */}
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        />
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Lista */}
      <div className="max-h-[500px] overflow-y-auto rounded-lg border border-border bg-muted/20">
        {pueblosFiltrados.length === 0 ? (
          <div className="p-8 text-center">
            <Caption>
              {busqueda
                ? t('noSearchResults')
                : t('allVisited')}
            </Caption>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {pueblosFiltrados.map((pueblo) => {
              const flagSrc = getComunidadFlagSrc(pueblo.comunidad);
              return (
                <div
                  key={pueblo.id}
                  className="flex items-center justify-between gap-3 bg-card p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {pueblo.nombre}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <Caption className="truncate">{pueblo.provincia}</Caption>
                      {flagSrc && (
                        <span className="shrink-0" title={pueblo.comunidad ?? undefined}>
                          <Image
                            src={flagSrc}
                            alt={`${t('flagOf')} ${pueblo.comunidad ?? ''}`}
                            width={24}
                            height={18}
                            className="rounded-sm border border-border object-cover"
                          />
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarcar(pueblo.id)}
                    disabled={loadingId === pueblo.id}
                    className="shrink-0 rounded-lg border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loadingId === pueblo.id ? (
                      <span className="flex items-center gap-1.5">
                        <svg
                          className="h-3 w-3 animate-spin"
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
                      t('mark')
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
