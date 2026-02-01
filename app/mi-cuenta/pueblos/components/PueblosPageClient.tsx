'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import PueblosVisitadosList from './PueblosVisitadosList';
import PueblosPorVisitar from './PueblosPorVisitar';
import MapaPueblosVisitados from '../mapa';

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

type Pueblo = {
  id: number;
  nombre: string;
  lat: number;
  lng: number;
  provincia?: string | null;
  comunidad?: string | null;
};

type Props = {
  initialData: {
    total: number;
    gps: number;
    manual: number;
    items: PuebloVisitado[];
  };
  todosPueblos: Pueblo[];
};

export default function PueblosPageClient({ initialData, todosPueblos }: Props) {
  const [data, setData] = useState(initialData);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sincronizar con datos frescos del servidor (ej. tras router.refresh())
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Set de IDs visitados
  const visitedIds = useMemo(() => {
    return new Set(data.items.map((item) => item.puebloId));
  }, [data.items]);

  // Función para marcar un pueblo como visitado
  const handleMarcarVisitado = useCallback(
    async (puebloId: number) => {
      const res = await fetch('/api/visitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puebloId }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Error al registrar visita');
      }

      // Encontrar el pueblo en todosPueblos para obtener sus datos
      const pueblo = todosPueblos.find((p) => p.id === puebloId);
      if (!pueblo) return;

      const puntosOtorgados = result.puntos?.puntos ?? 20;

      // Crear nuevo item visitado
      const nuevoItem: PuebloVisitado = {
        puebloId,
        pueblo: {
          id: puebloId,
          nombre: pueblo.nombre,
          slug: pueblo.nombre.toLowerCase().replace(/\s+/g, '-'),
          provincia: pueblo.provincia || '',
          comunidad: pueblo.comunidad || '',
          foto_destacada: null,
        },
        origen: 'MANUAL',
        ultima_fecha: new Date().toISOString(),
        rating: null,
      };

      // Actualizar estado local
      setData((prev) => ({
        total: prev.total + 1,
        gps: prev.gps,
        manual: prev.manual + 1,
        items: [nuevoItem, ...prev.items],
      }));

      // Mostrar mensaje de éxito
      setSuccessMsg(`${pueblo.nombre} marcado como visitado (+${puntosOtorgados} puntos)`);
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    [todosPueblos]
  );

  const handleRatingSaved = useCallback((puebloId: number, rating: number) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.puebloId === puebloId ? { ...it, rating } : it
      ),
    }));
  }, []);

  return (
    <div style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)' }}>
      <main className="max-w-[1600px] mx-auto px-4 py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Mis pueblos visitados</h1>
        </div>

        {/* Mensaje de éxito */}
        {successMsg && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm animate-pulse">
            {successMsg}
          </div>
        )}

        {/* Contadores */}
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-600">Total: </span>
            <span className="font-semibold">{data.total}</span>
          </div>
          <div>
            <span className="text-gray-600">GPS: </span>
            <span className="font-semibold">{data.gps}</span>
          </div>
          <div>
            <span className="text-gray-600">Manual: </span>
            <span className="font-semibold">{data.manual}</span>
          </div>
        </div>

        {/* Layout principal: visitados + mapa */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(520px, 1.1fr) minmax(700px, 1.9fr)',
            gap: 8,
            alignItems: 'start',
          }}
        >
          {/* Columna izquierda: pueblos visitados (scroll fijo) */}
          <div style={{ minWidth: 0 }} className="max-h-[70vh] overflow-y-auto">
            <PueblosVisitadosList
              items={data.items}
              onRatingSaved={handleRatingSaved}
            />
          </div>

          {/* Columna derecha: mapa */}
          <div style={{ minWidth: 0 }}>
            <MapaPueblosVisitados pueblos={todosPueblos} visitedIds={visitedIds} />
          </div>
        </div>

        {/* Pueblos por visitar: ancho completo, 4 columnas */}
        <div className="w-full">
          <PueblosPorVisitar
            pueblos={todosPueblos}
            visitedIds={visitedIds}
            onMarcarVisitado={handleMarcarVisitado}
          />
        </div>
      </main>
    </div>
  );
}
